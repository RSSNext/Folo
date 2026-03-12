---
name: mobile-self-test
description: Self-test a mobile feature change or bug fix after implementation in `apps/mobile`. Use this whenever the user asks to verify a mobile change, run simulator acceptance, smoke-test a mobile PR, or provide screenshot proof for a mobile fix. This skill decides between prod vs local API mode, starts the local follow-server when needed, builds a release app, uses Maestro only to bootstrap registration for non-auth work, then switches to screenshot-driven visual validation and returns screenshot evidence.
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Mobile Self Test

Validate a mobile change after implementation.

This skill extends `../mobile-e2e/SKILL.md`. Read that skill first for the baseline doctor checks, iOS simulator boot rules, Java/Android SDK setup, and Maestro artifact conventions. Then apply the extra rules in this skill.

## Files that matter

- Reference skill: `../mobile-e2e/SKILL.md`
- Runner: `apps/mobile/e2e/run-maestro.sh`
- iOS register flow: `apps/mobile/e2e/flows/ios/register.yaml`
- Android register flow: `apps/mobile/e2e/flows/android/register.yaml`
- Shared auth flows: `apps/mobile/e2e/flows/shared/*.yaml`
- Expo config: `apps/mobile/app.config.ts`
- Build profiles: `apps/mobile/eas.json`
- Mobile artifacts: `apps/mobile/e2e/artifacts/`
- Local server repo: `/Users/diygod/Code/Projects/follow-server`

## Default assumptions

- Prefer **iOS simulator** unless the user explicitly asks for Android or the change is Android-specific.
- Default to **prod API mode** when the user did not specify a mode.
- Default to **local API mode** when the task also involves local server changes, backend debugging, or modified files in `/Users/diygod/Code/Projects/follow-server`.
- Keep `EXPO_PUBLIC_E2E_LANGUAGE=en` unless the user explicitly wants another language. The existing Maestro flows assume English UI.

## Simulator and emulator isolation

This section overrides the shared device-selection guidance from `../mobile-e2e/SKILL.md`.

Self-test runs must be isolated because other agents may be using simulators or emulators on the same machine.

- Always create a dedicated temporary simulator or emulator for the current run.
- Never reuse `booted`, an already-running simulator, or a generic Android serial such as `emulator-5554`.
- Record the temporary device name and identifier immediately after creation, then use only that stored identifier for build, install, launch, screenshots, and Maestro.
- Register cleanup before booting the device so the temporary simulator or emulator is deleted even if the test fails midway.
- If cleanup fails, report the leftover device name and identifier in the final response.

## Decide API mode first

Use this decision order:

1. If the user explicitly asks for `prod` or `local`, obey that.
2. Otherwise, if the task depends on local backend changes or local server behavior, use `local`.
3. Otherwise, use `prod`.

Map the chosen mode into the release build:

- `prod` mode: `EXPO_PUBLIC_E2E_ENV_PROFILE=prod`
- `local` mode: `EXPO_PUBLIC_E2E_ENV_PROFILE=local`

Do not silently reuse a build from the other mode. Rebuild the release app when switching between `prod` and `local`.

## Always do first

From repo root:

```bash
cd apps/mobile
pnpm run e2e:doctor
pnpm run typecheck
```

If these fail, stop and report the blocker before attempting simulator work.

## Local server mode

`local` mode requires the local server to be available at `http://localhost:3000`.

Before starting anything, check whether it is already running. Do not start a duplicate server.

```bash
FOLLOW_SERVER_LOG=/tmp/follow-server-dev-core.log

if pgrep -af "pnpm dev:core" >/dev/null 2>&1 || lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "follow-server already running"
else
  (
    cd /Users/diygod/Code/Projects/follow-server
    nohup pnpm dev:core >"$FOLLOW_SERVER_LOG" 2>&1 &
  )
fi

for _ in $(seq 1 60); do
  nc -z 127.0.0.1 3000 >/dev/null 2>&1 && break
  sleep 2
done

nc -z 127.0.0.1 3000 >/dev/null 2>&1
```

If the task depends on other local surfaces such as `http://localhost:2233`, call that out explicitly instead of pretending the mobile test fully covers it.

## Release build profiles for self-test

Use release-style builds so the test matches user-facing behavior.

- iOS simulator builds: `PROFILE=e2e-ios-simulator`
- Android emulator builds: `PROFILE=e2e-android`

Always pair those with the chosen API mode and language:

```bash
export EXPO_PUBLIC_E2E_ENV_PROFILE=<prod-or-local>
export EXPO_PUBLIC_E2E_LANGUAGE=en
```

## iOS workflow

Do not attach to an existing simulator from `../mobile-e2e/SKILL.md`. Create a dedicated temporary simulator for this run and keep using only its UDID.

### Create a dedicated temporary simulator

Pick the latest available iOS runtime and a recent iPhone device type, then create a temporary simulator.

```bash
IOS_SIM_NAME="CodexSelfTest-$(date +%Y%m%d-%H%M%S)"
IOS_RUNTIME_ID="<latest available iOS runtime identifier from `xcrun simctl list runtimes`>"
IOS_DEVICE_TYPE_ID="<recent iPhone device type identifier from `xcrun simctl list devicetypes`>"

IOS_UDID="$(xcrun simctl create "$IOS_SIM_NAME" "$IOS_DEVICE_TYPE_ID" "$IOS_RUNTIME_ID")"

cleanup_ios_simulator() {
  xcrun simctl shutdown "$IOS_UDID" >/dev/null 2>&1 || true
  xcrun simctl delete "$IOS_UDID" >/dev/null 2>&1 || true
}

trap cleanup_ios_simulator EXIT
```

Do not switch to another simulator after `IOS_UDID` is created.

### Boot the dedicated simulator

```bash
xcrun simctl boot "$IOS_UDID"
xcrun simctl bootstatus "$IOS_UDID" -b
open -a Simulator --args -CurrentDeviceUDID "$IOS_UDID"
```

If other simulators are already booted, leave them alone and continue using only `IOS_UDID`.

### Build release simulator app

```bash
cd apps/mobile/ios
pod install

PROFILE=e2e-ios-simulator \
EXPO_PUBLIC_E2E_ENV_PROFILE=<prod-or-local> \
EXPO_PUBLIC_E2E_LANGUAGE=en \
xcodebuild -workspace Folo.xcworkspace \
  -scheme Folo \
  -configuration Release \
  -sdk iphonesimulator \
  -destination "id=$IOS_UDID" \
  clean build
```

On Apple Silicon Macs, when the build is only for the dedicated simulator created for the current self-test run, prefer compiling only the active `arm64` simulator architecture:

```bash
ONLY_ACTIVE_ARCH=YES \
ARCHS=arm64
```

Do not use that optimization when you need a universal simulator bundle for other machines or when the host Mac is Intel.

Expected output pattern:

```bash
~/Library/Developer/Xcode/DerivedData/.../Build/Products/Release-iphonesimulator/Folo.app
```

### Install app on simulator

```bash
xcrun simctl install "$IOS_UDID" <PATH_TO_Folo.app>
xcrun simctl launch "$IOS_UDID" is.follow
```

## Android workflow

Reuse the Java and Android SDK setup from `../mobile-e2e/SKILL.md`.

Do not attach to a shared emulator. Create a dedicated temporary AVD for this run and keep using only its recorded serial.

### Create a dedicated temporary AVD

Create a fresh AVD backed by an installed phone system image.

```bash
ANDROID_AVD_NAME="codex-self-test-$(date +%Y%m%d-%H%M%S)"
ANDROID_AVD_PACKAGE="<installed Android system image package>"
ANDROID_AVD_DEVICE="<phone hardware profile>"

avdmanager create avd -n "$ANDROID_AVD_NAME" -k "$ANDROID_AVD_PACKAGE" -d "$ANDROID_AVD_DEVICE" --force

ANDROID_EMULATOR_PORT=""
for port in 5554 5556 5558 5560 5562 5564; do
  if ! lsof -nP -iTCP:$port >/dev/null 2>&1 && ! lsof -nP -iTCP:$((port + 1)) >/dev/null 2>&1; then
    ANDROID_EMULATOR_PORT="$port"
    break
  fi
done

[ -n "$ANDROID_EMULATOR_PORT" ] || {
  echo "No free Android emulator port found"
  exit 1
}

ANDROID_DEVICE_ID="emulator-$ANDROID_EMULATOR_PORT"

cleanup_android_emulator() {
  adb -s "$ANDROID_DEVICE_ID" emu kill >/dev/null 2>&1 || true
  avdmanager delete avd -n "$ANDROID_AVD_NAME" >/dev/null 2>&1 || true
}

trap cleanup_android_emulator EXIT
```

### Boot the dedicated emulator

```bash
emulator @"$ANDROID_AVD_NAME" -port "$ANDROID_EMULATOR_PORT" -no-snapshot -wipe-data &
adb -s "$ANDROID_DEVICE_ID" wait-for-device
```

If other emulators are already booted, ignore them and continue using only `ANDROID_DEVICE_ID`.

If `apps/mobile/android` does not exist locally, generate it first.

```bash
cd apps/mobile
pnpm expo prebuild android
```

### Build release APK

```bash
cd apps/mobile/android

PROFILE=e2e-android \
EXPO_PUBLIC_E2E_ENV_PROFILE=<prod-or-local> \
EXPO_PUBLIC_E2E_LANGUAGE=en \
./gradlew clean app:assembleRelease --console=plain
```

Expected APK path:

```bash
apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

### Install app on emulator

```bash
adb -s "$ANDROID_DEVICE_ID" install -r apps/mobile/android/app/build/outputs/apk/release/app-release.apk
adb -s "$ANDROID_DEVICE_ID" shell monkey -p is.follow -c android.intent.category.LAUNCHER 1
```

## Cleanup is mandatory

Delete the temporary simulator or emulator created for the run before returning control to the user.

### iOS cleanup

```bash
xcrun simctl shutdown "$IOS_UDID" >/dev/null 2>&1 || true
xcrun simctl delete "$IOS_UDID" >/dev/null 2>&1 || true
```

### Android cleanup

```bash
adb -s "$ANDROID_DEVICE_ID" emu kill >/dev/null 2>&1 || true
avdmanager delete avd -n "$ANDROID_AVD_NAME" >/dev/null 2>&1 || true
```

Do not leave temporary devices behind for other agents.

## Choose the auth strategy

This is the core difference from `mobile-e2e`.

### A. Change is **not** related to login or registration

Use the existing automated **registration** flow first to bootstrap a clean logged-in account, then do the real verification visually.

Examples:

- timeline behavior
- subscription management
- onboarding content after auth
- settings pages unrelated to sign-in state
- player, reader, share, discover, profile editing

Generate a unique test account before running the flow:

```bash
export E2E_PASSWORD='Password123!'
export E2E_EMAIL="folo-self-test-$(date +%Y%m%d%H%M%S)@example.com"
```

For non-auth iOS self-tests, bootstrap auth through the standard iOS runner mode after the app has been installed and launched once:

```bash
cd apps/mobile
pnpm run e2e:ios:bootstrap
```

This bootstrap path is the default for `prod` and `local` self-tests. Only skip it when the feature under test is login, registration, sign-out, session restoration, or another auth-specific flow that must be validated visually end-to-end.

#### iOS registration bootstrap

```bash
cd apps/mobile
maestro test --format junit --platform ios --device "$IOS_UDID" \
  --debug-output e2e/artifacts/ios/register-bootstrap \
  -e E2E_EMAIL="$E2E_EMAIL" \
  -e E2E_PASSWORD="$E2E_PASSWORD" \
  e2e/flows/ios/register.yaml
```

#### Android registration bootstrap

```bash
cd apps/mobile
maestro test --format junit --platform android --device "$ANDROID_DEVICE_ID" \
  --debug-output e2e/artifacts/android/register-bootstrap \
  -e E2E_EMAIL="$E2E_EMAIL" \
  -e E2E_PASSWORD="$E2E_PASSWORD" \
  e2e/flows/android/register.yaml
```

After registration succeeds, continue with screenshot-driven visual testing.

### B. Change **is** related to login, registration, logout, session handling, auth validation, or onboarding gates

Do **not** rely on the existing Maestro auth flows for the actual verification. Use a fully visual/manual run instead so the changed UX itself is what gets tested.

Examples:

- register screen changes
- login screen changes
- credential validation changes
- auth toggle changes
- logout behavior
- auth/session restoration
- onboarding shown or hidden based on auth state

For auth-related work:

- create the test account manually through the UI if needed
- use screenshots after every critical step
- verify success and error states visually
- keep a clean record of the exact screen sequence shown to the user

## Screenshot-driven visual testing

Once the app is in the right state, drive the rest of the validation with the visual toolchain available in the current environment. Screenshots are the source of truth for acceptance.

Create a timestamped artifact folder first:

```bash
REPO_ROOT="$(git rev-parse --show-toplevel)"
ARTIFACT_DIR="$REPO_ROOT/apps/mobile/e2e/artifacts/manual/$(date +%Y%m%d-%H%M%S)-<platform>-<prod-or-local>"
mkdir -p "$ARTIFACT_DIR"
```

Capture screenshots after each meaningful checkpoint.

### iOS screenshot command

```bash
xcrun simctl io "$IOS_UDID" screenshot "$ARTIFACT_DIR/<name>.png"
```

### Android screenshot command

```bash
adb -s "$ANDROID_DEVICE_ID" exec-out screencap -p > "$ARTIFACT_DIR/<name>.png"
```

Minimum screenshot set for a complete self-test:

1. entry screen before the changed flow
2. the changed screen or interaction in progress
3. the final success state or the reproduced bug state

Add more screenshots when the flow has multiple important states.

Do not report success without screenshot evidence.

## What to validate visually

Use the screenshots to confirm at least these points when relevant:

- the correct screen is reached
- the changed control, copy, or layout is visible
- loading, empty, error, and success states look correct
- the operation completes without obvious regressions or blocking dialogs
- the app is talking to the intended environment (`prod` or `local`)

If the UI or behavior is ambiguous, capture another screenshot instead of guessing.

## Final user-facing output

The final response must include:

- API mode used and why it was chosen
- platform and dedicated simulator/emulator name plus identifier used
- cleanup result for the temporary simulator/emulator
- whether the local server was reused or started, plus log path if started
- build command used
- whether auth bootstrap was automated or fully visual
- concise step-by-step result summary
- pass/fail conclusion
- screenshot evidence with absolute file paths

If the client supports local image rendering, attach the key screenshots as images in the final message. Otherwise, list the absolute paths clearly so the user can open them.

## Failure handling

- If doctor, typecheck, build, install, or server startup fails, stop and report the exact failing command.
- If `local` mode cannot reach the local server, do not silently fall back to `prod`.
- If the visual flow cannot be completed because the environment lacks the required interaction tooling, report that limitation clearly and still return the screenshots you captured.
