# Verifying the Android build

Used for the PR's preview APK (B3), the release APK check (C3) and the OTA old-binary check (C4).

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
BT=$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)
```

## 1. Download and static checks

```bash
gh run download <build-android run> -n app-android -D "$SCRATCH/pr/android"
APK="$SCRATCH/pr/android/build.apk"
"$BT/aapt2" dump badging "$APK" | grep -E "^package:|^application-label:"
"$BT/apksigner" verify --print-certs "$APK" | grep -E "SHA-256"
```

Expected: package `is.follow`, `versionName` the new version, label "Folo", and certificate SHA-256 `4c2c3438d76d61ee5b18e8cd841776284e3d25574fa2ea68af809154aa496e08`. That is the EAS key; preview, `production-apk` and GitHub release APKs all carry it, so they update each other in place and keep app data. A Google Play install is re-signed by Google and cannot be updated with these APKs.

The preview build talks to the production API, uses the `preview` OTA channel and shows the staging icon.

## 2. Pick the device

- Signed-in checks: the QA emulator `Folo_Release_QA`, whose `is.follow` holds a session for the demo account (1Password item `mczvztynp5if7izw5wvmoggtru`). Installing over it keeps that session.
- No QA emulator: a temporary AVD created for this run, as a guest. The first launch shows the sign-up screen; its close button (top left, missing from the accessibility tree, so tap it by coordinates) leads to a populated guest timeline, so reading, player and pushed-screen checks still work. Mark the signed-in items "not run".
- Never take over an emulator another session drives (`ps aux | grep -E "capture-android|maestro"`; the store screenshot work has used `emulator-5554` / `Medium_Phone_API_36`), and never a physical phone (`adb devices` may list the user's). Always pass `-s <serial>`.

The Android command-line tools (`avdmanager`, `sdkmanager`) are not installed here. Create an AVD by copying the existing one's config; the only system image is `android-36/google_apis_playstore/arm64-v8a`:

```bash
NAME=Folo_Verify_$(date +%H%M%S)    # or Folo_Release_QA for the persistent QA emulator
AVD="$HOME/.android/avd"
mkdir -p "$AVD/$NAME.avd"
cp "$AVD/Medium_Phone.avd/config.ini" "$AVD/$NAME.avd/config.ini"
sed -i '' -e "s/^AvdId = .*/AvdId = $NAME/" -e "s/^avd.ini.displayname = .*/avd.ini.displayname = $NAME/" "$AVD/$NAME.avd/config.ini"
printf 'avd.ini.encoding=UTF-8\npath=%s\npath.rel=avd/%s.avd\ntarget=android-36\n' "$AVD/$NAME.avd" "$NAME" > "$AVD/$NAME.ini"
```

Boot a new AVD once with `-wipe-data` to create fresh user data; never pass `-wipe-data` to `Folo_Release_QA` after that, it erases the signed-in session. On that first boot Android may show "System UI isn't responding"; tap Wait (`android:id/aerr_wait`). Deleting an AVD means removing `$AVD/$NAME.avd` and `$AVD/$NAME.ini` after `adb -s <serial> emu kill`.

Creating `Folo_Release_QA` once: create it as above, boot it, install the current GitHub release APK (`gh release download mobile/v<live version> -p build.apk`), and sign in to the demo account; an agent that may not type passwords asks the user to do that sign-in. Do the same if the emulator lost its session.

Boot and install (a booted copy of this config reports `sys.boot_completed` after about 15 seconds):

```bash
PORT=5560; SERIAL="emulator-$PORT"     # pick a port pair nothing listens on
(emulator @"$NAME" -port $PORT -no-snapshot-save -no-boot-anim -no-audio > "$SCRATCH/emulator.log" 2>&1 &)
adb -s "$SERIAL" wait-for-device
until [ "$(adb -s "$SERIAL" shell getprop sys.boot_completed | tr -d '\r')" = 1 ]; do sleep 3; done
adb -s "$SERIAL" install -r -d "$APK"
adb -s "$SERIAL" shell monkey -p is.follow -c android.intent.category.LAUNCHER 1
```

## 3. Drive the app and check

- Read the screen with `adb -s "$SERIAL" exec-out uiautomator dump /dev/tty`; builds after 0.5.10 expose testIDs as `resource-id` (for example `timeline-entry-first`, `entry-item-<id>`, `floating-player-bar`, `player-stop`). Under react-native-screens modals the dump can be stale; `adb shell dumpsys activity top` shows the real tree.
- Act with `adb -s "$SERIAL" shell input tap <x> <y>`, `input swipe …`, `input text …`, `input keyevent KEYCODE_BACK`. Before any coordinate tap, check the app is in front (`adb shell dumpsys window | grep -E 'mCurrentFocus|mFocusedApp'`) and the element center is inside the visible content; a misplaced tap once marked the demo account's Articles as read.
- Maestro is fine for navigation flows. Never run the register or login flows against production.
- Screenshots: `adb -s "$SERIAL" exec-out screencap -p > "$SCRATCH/shots/android-<item>.png"`.
- Settings → About shows `<version> (<build>) · OTA <x>`, where `x` is the OTA release version once an update runs and the runtime version otherwise.
- Crashes: `adb -s "$SERIAL" logcat -b crash -d` and `adb -s "$SERIAL" logcat -d -t 3000 | grep -E "FATAL EXCEPTION|ReactNativeJS"`.
- The demo account is shared with the store screenshot work. Read only by default: no "mark all as read", unsubscribing, deleting or purchases; revert any setting you change.

## 4. OTA old-binary check (C4, OTA mode)

On a temporary AVD (fresh install, guest is fine):

```bash
gh release download "mobile/v<runtimeVersion>" -p build.apk -D "$SCRATCH/old-binary"
adb -s "$SERIAL" install "$SCRATCH/old-binary/build.apk"
adb -s "$SERIAL" shell monkey -p is.follow -c android.intent.category.LAUNCHER 1
```

The app checks for an update in the background after launch and applies a downloaded update on the next launch. Wait about a minute, then `adb -s "$SERIAL" shell am force-stop is.follow`, launch again, and confirm Settings → About shows `OTA <new version>` and the changed screens behave. The release APK uses the `production` channel; for a `preview` OTA, use a preview APK instead.

## 5. Clean up

- Temporary AVD: `adb -s "$SERIAL" emu kill`, then `rm -rf "$AVD/$NAME.avd" "$AVD/$NAME.ini"`.
- QA emulator: `adb -s "$SERIAL" emu kill`, keep the AVD.
- Watch disk space; emulator images grow quickly.
