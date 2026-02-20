---
name: installing-mobile-preview-builds
description: Builds and installs the iOS preview build for apps/mobile using EAS local build and devicectl. Use when the user asks to install a preview/internal iOS build on a connected iPhone for production-like testing.
disable-model-invocation: true
allowed-tools: Bash, Read, Glob, Grep
argument-hint: "[device-udid-or-name(optional)]"
---

# Install Mobile Preview Build (iOS)

Use this skill to create a fresh local `preview` iOS build and install it on a connected iPhone.

## Inputs

- Optional `$ARGUMENTS`: device identifier (UDID or exact device name).
- If no argument is provided, auto-select the first paired iPhone from `xcrun devicectl list devices`.

## Workflow

1. Validate repo and tooling.
   - Run from repo root and ensure `apps/mobile` exists.
   - Verify `pnpm`, `xcrun`, `xcodebuild`, and `eas-cli` are available.
   - Verify EAS login:
     ```bash
     cd apps/mobile
     pnpm dlx eas-cli whoami
     ```
2. Resolve target device.
   - List paired devices:
     ```bash
     xcrun devicectl list devices
     ```
   - Choose device in this order:
     - `$ARGUMENTS` if provided and matches exactly one device.
     - Otherwise, first paired iPhone.
3. Trigger local `preview` iOS build.

   ```bash
   mkdir -p .context/preview-install
   cd apps/mobile
   pnpm dlx eas-cli build -p ios --profile preview --non-interactive --local --output=./build-preview.ipa
   cd ../..
   cp apps/mobile/build-preview.ipa .context/preview-install/folo-preview.ipa
   ```

4. Install to device locally.
   ```bash
   unzip -q -o .context/preview-install/folo-preview.ipa -d .context/preview-install/unpacked
   APP_PATH=$(find .context/preview-install/unpacked/Payload -maxdepth 1 -name '*.app' -type d | head -n 1)
   xcrun devicectl device install app --device "<device-id>" "$APP_PATH"
   ```
5. Try launching app.

   ```bash
   xcrun devicectl device process launch --device "<device-id>" is.follow --activate
   ```

   - If launch fails due to locked device, instruct the user to unlock iPhone and open `Folo` manually.

## Failure Handling

- If local build fails, report:
  - build mode (`local`)
  - failing command
  - key error message from command output
- If app config fails with `Assets source directory not found ... /out/rn-web`, prebuild assets then retry once:
  ```bash
  pnpm --filter @follow/rn-micro-web-app build --outDir out/rn-web/html-renderer
  ```

## Output Format

Always return:

1. Build mode (`local`) and final status.
2. Local IPA path.
3. Target device identifier.
4. Install result (`installed` or `failed`) and launch result.
5. Next action for the user if manual action is required.
