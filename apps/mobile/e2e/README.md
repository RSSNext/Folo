# Mobile E2E

## Requirements

- Install Maestro CLI.
- Android: install the app on a booted emulator.
- iOS: provide a standalone simulator app bundle via `MAESTRO_IOS_APP_PATH`, or place a local `build-*.tar.gz` from `eas build --local --platform ios --profile e2e-ios-simulator` in `apps/mobile`.
- Export `E2E_EMAIL` if you want to reuse a fixed account. Otherwise the runner script creates a unique address.

## Commands

```bash
pnpm run e2e:doctor
pnpm run e2e:android
pnpm run e2e:ios
pnpm run e2e:ios:bootstrap
```

## iOS Notes

- `pnpm run e2e:ios` runs two real journeys in sequence:
  - `auth.yaml`: register -> sign out -> log in
  - `content.yaml`: ensure onboarding feed unfollowed -> follow -> timeline/read-unread -> unfollow
- The iOS runner resets the simulator, disables password autofill prompts, installs the provided app bundle, then executes Maestro.
- Auth and content run sequentially against the same signed-in app. Each journey writes its own debug artifacts and JUnit report under `auth/` or `content/` in `MAESTRO_DEBUG_OUTPUT` (default: `e2e/artifacts/ios`). A failed journey stops the runner.

## Prod iOS auth bootstrap

When non-auth iOS self-tests need a signed-in simulator quickly, bootstrap auth through the standard iOS runner mode:

```bash
pnpm run e2e:ios:bootstrap
```

This mode uses the auth bootstrap helper on iOS when `EXPO_PUBLIC_E2E_ENV_PROFILE=prod` or `EXPO_PUBLIC_E2E_ENV_PROFILE=local`, and falls back to the normal iOS registration flow for other environments.

Optional environment variables:

- `E2E_EMAIL`
- `E2E_PASSWORD`
- `MAESTRO_IOS_DEVICE_ID`
- `E2E_API_URL`
- `E2E_CALLBACK_URL`
- `E2E_BUNDLE_ID`

The bootstrap script signs in against prod using the mobile fallback token header, writes the auth cookie into the simulator's `ExpoSQLiteStorage` fallback store, and relaunches the app.

## Environment

- `E2E_EMAIL`
- `E2E_PASSWORD`
- `MAESTRO_DEBUG_OUTPUT`
- `MAESTRO_IOS_APP_PATH`
- `EXPO_PUBLIC_E2E_ENV_PROFILE`
- `EXPO_PUBLIC_E2E_LANGUAGE`

## Local native StoreKit verification

To exercise `expo-iap` itself instead of the local `buyProduct` helper shortcut,
build a simulator app with all of the following settings:

```bash
# Run from apps/mobile/ios after pod install. Set UDID to a dedicated test simulator.
EXPO_PUBLIC_E2E_ENV_PROFILE=local EXPO_PUBLIC_E2E_LANGUAGE=en \
EXPO_PUBLIC_E2E_IAP_NATIVE=1 PROFILE=e2e-ios-simulator \
xcodebuild -workspace Folo.xcworkspace -scheme Folo -configuration Release \
  -sdk iphonesimulator -destination "id=${UDID}" build \
  CODE_SIGNING_ALLOWED=NO ENABLE_TESTING_SEARCH_PATHS=YES \
  'SWIFT_ACTIVE_COMPILATION_CONDITIONS=$(inherited) STOREKIT_TESTING'
```

Use the isolated API at `http://localhost:3000` and a local test account. The flag
requires an enabled native `SKTestSession` using the bundled StoreKit file before
loading products or requesting, restoring, or verifying purchases. Missing test
support fails closed. The helper injects a randomly named readiness product into
a temporary copy of the local configuration and requires StoreKit to return it;
it does not change the six subscription products or expose the probe in the app.
This detects simulator failures that silently ignore test configuration writes.
The ordinary application behavior is unchanged when the
flag is absent. Never use this verification against a production API or Apple
store account.

Activate the local configuration through a temporary Xcode scheme's Run →
Options → StoreKit Configuration before launching the test app. The validated
run used a separate temporary workspace/scheme, the Release app above, and an
iOS 18.5 simulator. Leave the project's normal scheme and real store settings
unchanged. A standalone launch is not sufficient on every simulator runtime:
iOS 26.5 (23F77) rejected configuration writes with StoreKitTest code 3.

For a prelaunch readiness probe, copy the bundled `.storekit` file to the temporary
scheme, add a `NonConsumable` product with a unique `is.follow.e2e.probe.` ID, and
set `FOLO_E2E_STOREKIT_PROBE_ID` to that same ID in the scheme's launch environment.
The helper creates its own temporary copy containing this product and verifies
that it is available before any purchase. Never add this probe to the app's six
subscription identifiers or App Store Connect.

The test launch also needs Xcode's XCTest runtime frameworks. Without these
search paths, StoreKitTest can abort inside `XCTestLibrary` before returning from
session initialization. Set `DYLD_FRAMEWORK_PATH` / `DYLD_LIBRARY_PATH` in the
temporary scheme, or use their `SIMCTL_CHILD_` forms for a standalone diagnostic:

```bash
simulator_developer="$(xcode-select -p)/Platforms/iPhoneSimulator.platform/Developer"
SIMCTL_CHILD_DYLD_FRAMEWORK_PATH="${simulator_developer}/Library/Frameworks:${simulator_developer}/Library/PrivateFrameworks" \
SIMCTL_CHILD_DYLD_LIBRARY_PATH="${simulator_developer}/usr/lib" \
SIMCTL_CHILD_FOLO_E2E_STOREKIT_CANCEL_ONCE=1 \
xcrun simctl launch --terminate-running-process "${UDID}" is.follow
```

Omit `SIMCTL_CHILD_FOLO_E2E_STOREKIT_CANCEL_ONCE` for a success-only run.
The test-only helper then injects StoreKit's `userCancelled` error; the first
`useIAP` error callback clears it and resets test settings, retaining transactions.
The reset is necessary on the validated iOS 18.5 runtime: setting the error to
`nil` alone reports success but leaves the next native purchase failing. Recovery
checks the cleared error, disabled dialogs and local probe again. A subsequent
purchase awaits this recovery promise and fails closed if recovery fails. Verify the UI leaves its loading state after cancellation, then verify
`[StoreKit E2E]` events for `request-purchase`, `purchase-success`,
`server-verified`, and `transaction-finished`, as well as the local API billing
state. These events deliberately omit receipts, account tokens, and transaction
payloads. Restore can be exercised in the same session; preparing a new test
session clears its transactions.
