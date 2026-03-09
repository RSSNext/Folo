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
```

## iOS Notes

- `pnpm run e2e:ios` runs two real journeys in sequence:
  - `auth.yaml`: register -> sign out -> log in
  - `content.yaml`: ensure onboarding feed unfollowed -> follow -> timeline/read-unread -> unfollow
- The iOS runner resets the simulator, disables password autofill prompts, installs the provided app bundle, then executes Maestro.

## Environment

- `E2E_EMAIL`
- `E2E_PASSWORD`
- `MAESTRO_DEBUG_OUTPUT`
- `MAESTRO_IOS_APP_PATH`
- `EXPO_PUBLIC_E2E_ENV_PROFILE`
- `EXPO_PUBLIC_E2E_LANGUAGE`
