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
