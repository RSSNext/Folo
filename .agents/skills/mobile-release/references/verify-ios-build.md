# Verifying the iOS build

The PR's `🍎 Build iOS` run produces an ad-hoc signed `build.ipa` (artifact `app-ios`). It runs only on physical devices listed in its provisioning profile, and iOS is verified on simulators only, never on the user's devices. So the iOS checks have two parts: static checks of that IPA, and functional checks on a simulator with a Release build of the same commit.

## 1. Static checks of the CI IPA

```bash
gh run download <build-ios run> -n app-ios -D "$SCRATCH/pr/ios"
mkdir -p "$SCRATCH/pr/ios/ipa" && unzip -q -o "$SCRATCH/pr/ios/build.ipa" -d "$SCRATCH/pr/ios/ipa"
APP="$SCRATCH/pr/ios/ipa/Payload/Folo.app"
plutil -p "$APP/Info.plist" | grep -E 'CFBundle(Identifier|ShortVersionString|Version)"|MinimumOSVersion|UIApplicationSceneManifest'
plutil -p "$APP/Expo.plist" | grep -E 'EXUpdates(Enabled|RuntimeVersion|URL)|expo-channel-name'
security cms -D -i "$APP/embedded.mobileprovision" > "$SCRATCH/pr/ios/profile.plist"
plutil -p "$SCRATCH/pr/ios/profile.plist" | grep -E '"Name"|ExpirationDate|TeamName|aps-environment|get-task-allow'
plutil -extract ProvisionedDevices json -o - "$SCRATCH/pr/ios/profile.plist"
codesign -dv "$APP" 2>&1 | grep -E 'Identifier=|TeamIdentifier'
```

Expected: bundle ID `is.follow`; `CFBundleShortVersionString` is the new version; `UIApplicationSceneManifest` present (Xcode 27 builds need UIScene to launch on iOS 27); Expo.plist with `EXUpdatesRuntimeVersion` equal to the new version, channel `preview` and URL `https://ota.folo.is/manifest`; an AdHoc profile of NATURAL SELECTION LABS PTE. LTD. that has not expired, with `aps-environment` `production`.

## 2. Functional checks on a simulator

### Build

Build Release for the simulator from the release branch head, the same commit CI built. Start it while the CI runs are still going; it takes 10–20 minutes.

```bash
REPO=$(git rev-parse --show-toplevel)
pnpm --dir apps/mobile/web-app build --outDir "$REPO/out/rn-web/html-renderer"
(cd apps/mobile/ios && LANG=en_US.UTF-8 pod install)
PROFILE=preview xcodebuild -workspace apps/mobile/ios/Folo.xcworkspace -scheme Folo -configuration Release \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath "$SCRATCH/ios-dd" \
  ONLY_ACTIVE_ARCH=YES ARCHS=arm64 build
SIM_APP="$SCRATCH/ios-dd/Build/Products/Release-iphonesimulator/Folo.app"
```

- Check `apps/mobile/ios/.xcode.env.local` first. It is git-ignored and can set `EXPO_PUBLIC_E2E_ENV_PROFILE`, which overrides the environment; a "LOCAL" badge in the app means it talks to localhost. The release check needs the production API.
- A failed build can leave an empty `Folo.app` stub in the derived data; delete it before trusting a rerun.
- After the build, `git status` must be clean; a local build can raise `CFBundleVersion` in `ios/Folo/Info.plist`. Revert such changes.
- The local app is not the CI binary. The committed `Expo.plist` has updates disabled and runtime `0.0.0-dev`, while EAS writes the real runtime, the `preview` channel, the update URL and the signing certificate into the CI build, so the OTA client can't be tested on a local simulator build (Android's CI APK covers it). CI also builds with Xcode 26.4.1 on GitHub runners (`.github/actions/setup-xcode`; a free self-hosted runner, when present, uses its own Xcode), while the local Xcode may be newer. Call out native or layout differences that could come from the toolchain instead of the code.

### Pick the simulator

- Signed-in checks: the QA simulator "Folo Release QA", where `is.follow` holds a session for the demo account (1Password item `mczvztynp5if7izw5wvmoggtru`). `xcrun simctl install` over it keeps the data and the session.
- No QA simulator, or it lost the session: create it once (the current one is an iPhone 17 Pro on iOS 27.0: `xcrun simctl create "Folo Release QA" com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro com.apple.CoreSimulator.SimRuntime.iOS-27-0`), install the build, and sign in to the demo account; an agent that may not type passwords asks the user to do that sign-in. Xcode 27 has no Simulator.app; the simulator window the user signs in through is in `/Applications/Xcode.app/Contents/Applications/DeviceHub.app`. Until then, use a temporary simulator for this run (rules and commands in `.agents/skills/mobile-self-test/SKILL.md`) as a guest and mark the signed-in items "not run".
- Never use a simulator another session drives (`ps aux | grep -E "capture-ios|listen-pass|maestro"`; the store screenshot work has used simulators named "Store …").

```bash
SIM=$(xcrun simctl list devices -j | jq -r '[.devices[][] | select(.name == "Folo Release QA" and .isAvailable)][0].udid // empty')
# no QA simulator: SIM=$(xcrun simctl create "Folo-Verify-$(date +%H%M%S)" <device type> <runtime>) and treat it as temporary
xcrun simctl boot "$SIM"; xcrun simctl bootstatus "$SIM" -b
xcrun simctl install "$SIM" "$SIM_APP"
xcrun simctl launch "$SIM" is.follow
```

### Drive and check

- Use `axe` (see the axe skill) or another simulator automation tool: `axe describe-ui --udid "$SIM"` for the tree (builds after 0.5.10 expose testIDs as `AXUniqueId`), `axe tap`, `axe swipe`, `axe type`. On iPad, the entry "more" menu opens on a physical tap and its items need a held press (`axe touch --delay 0.2`).
- Before any coordinate tap, confirm the expected screen shows and the element center is inside the visible content; a tap under the native tab bar once landed on another tab and marked the demo account's Articles as read.
- Screenshots: `xcrun simctl io "$SIM" screenshot "$SCRATCH/shots/ios-<item>.png"`.
- Settings → About shows `<version> (<build>)`; the OTA suffix is meaningless on a local build (updates are off).
- Crashes: `xcrun simctl spawn "$SIM" log show --last 10m --style compact --predicate 'process == "Folo"' | grep -iE 'fault|crash|exception'`, and new `Folo-*.ips` files in `~/Library/Logs/DiagnosticReports`.
- The demo account is shared with the store screenshot work. Read only by default: no "mark all as read", unsubscribing, deleting or purchases; revert any setting you change.

### Clean up

Temporary simulator: `xcrun simctl shutdown "$SIM"; xcrun simctl delete "$SIM"`. QA simulator: shut it down and keep it. Remove `$SCRATCH/ios-dd` once the report is written; derived data is large.
