---
name: mobile-e2e
description: Run apps/mobile Maestro end-to-end tests in this repo. Use when an agent needs to validate mobile auth flows on iOS Simulator or Android Emulator. Current maintained coverage is register, sign out, and sign in.
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Mobile E2E

Run the mobile Maestro tests for `apps/mobile`.

## Files that matter

- Runner: `apps/mobile/e2e/run-maestro.sh`
- iOS auth flow: `apps/mobile/e2e/flows/ios/auth.yaml`
- Android auth flow: `apps/mobile/e2e/flows/android/core.yaml`
- Shared auth flows: `apps/mobile/e2e/flows/shared/*.yaml`
- Artifacts: `apps/mobile/e2e/artifacts/`

## Always do first

From repo root:

```bash
cd apps/mobile
pnpm run e2e:doctor
pnpm run typecheck
```

## iOS

Use a simulator `.app` build, not an Expo development client.

### Preferred simulator

Prefer the **latest installed iOS runtime** and a **latest-generation iPhone simulator**.

When multiple simulators are available, bias toward the newest iPhone model on the newest installed iOS version.

### Boot simulator

```bash
xcrun simctl boot <IOS_UDID>
xcrun simctl bootstatus <IOS_UDID> -b
open -a Simulator --args -CurrentDeviceUDID <IOS_UDID>
```

### App bundle

`run-maestro.sh` can resolve the app bundle from one of these sources:

- `MAESTRO_IOS_APP_PATH`
- a local `build-*.tar.gz` in `apps/mobile`
- an existing `DerivedData/.../Release-iphonesimulator/Folo.app`

If none of those exist, build one first.

### Build simulator app when missing

If `Folo.app` is not available yet:

```bash
cd apps/mobile/ios
pod install
xcodebuild -workspace Folo.xcworkspace \
  -scheme Folo \
  -configuration Release \
  -sdk iphonesimulator \
  -destination 'id=<IOS_UDID>' \
  build
```

Expected output pattern:

```bash
~/Library/Developer/Xcode/DerivedData/.../Build/Products/Release-iphonesimulator/Folo.app
```

### Run iOS auth flow

```bash
cd apps/mobile
MAESTRO_IOS_DEVICE_ID=<IOS_UDID> \
MAESTRO_IOS_APP_PATH=<PATH_TO_Folo.app> \
pnpm run e2e:ios
```

## Android

Use a **release APK**, not an Expo development build.

### Java

Use Android Studio bundled JBR:

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
```

### Android SDK

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"
```

If `apps/mobile/android/local.properties` is missing, create it with:

```bash
echo "sdk.dir=$HOME/Library/Android/sdk" > apps/mobile/android/local.properties
```

### Build release APK

If `apps/mobile/android` does not exist locally, generate it first with Expo prebuild / run-android tooling.

Then build the release APK:

```bash
cd apps/mobile/android
./gradlew app:assembleRelease --console=plain
```

Expected APK path:

```bash
apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

### Install to emulator

```bash
adb -s emulator-5554 install -r apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

### Run Android auth flow

Start a booted emulator first, then:

```bash
cd apps/mobile
pnpm run e2e:android
```

## Result checks

Successful auth validation means:

- register flow finishes
- sign-out reaches `login-screen`
- login flow makes `login-screen` disappear

## Debugging output

Inspect these folders after a run:

```bash
apps/mobile/e2e/artifacts/ios/
apps/mobile/e2e/artifacts/android/
```

For a one-off focused run, invoke Maestro directly against a single flow and a custom debug directory.
