# Desktop Local Packaging

This document explains how to generate a local macOS desktop package for Folo, how to verify that the package is runnable, and how to diagnose the two issues that were already seen in this repository.

## Scope

- This guide is for local macOS packaging only.
- It is intended for local verification, QA, and internal testing.
- It does not replace the signed and notarized release flow.

## Conclusion First

- A local macOS build does not require an Apple signing certificate.
- The repository now supports unsigned local packaging by using ad-hoc signing for the app bundle.
- In the local unsigned path, Hardened Runtime is explicitly disabled so the packaged Electron app can actually launch.

Relevant config:

- [`apps/desktop/forge.config.cts`](/Users/dustin/.codex/worktrees/ee0b/Folo/apps/desktop/forge.config.cts)

## Prerequisites

1. Use the project-supported package manager:

```bash
pnpm install
```

2. Make sure your active `node` is stable during the whole packaging flow.

Recommended checks:

```bash
which node
node -v
pnpm -v
```

3. Run packaging from the desktop app directory:

```bash
cd apps/desktop
```

## Recommended Packaging Commands

For a fresh local package, use the full build:

```bash
pnpm run build:electron
```

This does two things:

1. Builds the Electron app with `electron-vite`
2. Generates distributables with `electron-forge`

If you already have an up-to-date `dist/` and only want to rerun the packaging step, you can use:

```bash
pnpm run build:electron-forge
```

For macOS multi-arch packaging:

```bash
pnpm run build:electron-forge:macos
```

## Output Locations

After a successful local macOS build, the main outputs are here:

- App bundle:

```text
apps/desktop/out/Folo-darwin-arm64/Folo.app
```

- DMG:

```text
apps/desktop/out/make/Folo-<version>-macos-arm64.dmg
```

- ZIP:

```text
apps/desktop/out/make/zip/darwin/arm64/Folo-<version>-macos-arm64.zip
```

## Verify the Result

After packaging, verify both signature integrity and actual launch.

### 1. Verify code signing structure

```bash
codesign --verify --deep --strict --verbose=4 apps/desktop/out/Folo-darwin-arm64/Folo.app
codesign --verify --strict --verbose=4 "apps/desktop/out/Folo-darwin-arm64/Folo.app/Contents/Frameworks/Electron Framework.framework/Versions/A/Electron Framework"
spctl -a -vv apps/desktop/out/Folo-darwin-arm64/Folo.app
```

Expected result:

- `codesign` should report `valid on disk`
- `spctl` may show `accepted`
- Local unsigned builds are expected to use `adhoc` signature

### 2. Verify the app actually launches

```bash
apps/desktop/out/Folo-darwin-arm64/Folo.app/Contents/MacOS/Folo
```

If the app stays alive and prints normal application logs, the local package is runnable.

## How Local Unsigned Packaging Works

For local macOS builds without `OSX_SIGN_IDENTITY`:

- The app is signed with ad-hoc signing using `identity: "-"`
- Identity validation is disabled
- Hardened Runtime is disabled
- Signing errors are not ignored

This behavior is important for two reasons:

1. Electron Packager mutates the upstream Electron bundle during packaging, so the bundle must be re-signed even for local builds.
2. If Hardened Runtime stays enabled under ad-hoc signing, `dyld` can reject `Electron Framework` at launch because there is no usable Team ID relationship.

## Release Build vs Local Build

### Local build

- No Apple certificate required
- No notarization required
- Intended for local install and verification

### Release build

- Requires a real signing identity
- Usually requires notarization
- Uses the certificate-based macOS signing path

## Common Problems

### Problem 1: App launches and immediately crashes

Example symptom:

```text
Termination Reason: Namespace CODESIGNING, Code 2
```

or:

```text
Library not loaded: @rpath/Electron Framework.framework/Electron Framework
... mapped file (non-platform) have different Team IDs
```

Cause:

- The app was packaged with an invalid or incomplete local signing setup.
- Or Hardened Runtime was left enabled on an ad-hoc signed local build.

Fix:

- Rebuild using the current `forge.config.cts`
- Regenerate the package with:

```bash
cd apps/desktop
pnpm run build:electron
```

- Re-test the newly generated `.app`, not an older copied one

### Problem 2: `macos-alias` native module ABI mismatch

Example symptom:

```text
was compiled against a different Node.js version using NODE_MODULE_VERSION XXX
This version of Node.js requires NODE_MODULE_VERSION YYY
```

Cause:

- `electron-forge` is being executed by a different `node` than the one used when native dependencies were installed or rebuilt.

Fix:

1. Check the active node:

```bash
which node
node -v
```

2. Rebuild the native dependency under the current node:

```bash
pnpm rebuild macos-alias
```

3. If rebuild is still inconsistent, reinstall dependencies with the intended node version:

```bash
pnpm install
```

Important:

- Do not switch between multiple Node installations midway through install and packaging unless you rebuild native modules again.

## Recommended Local Workflow

Use this sequence for local macOS packaging:

```bash
pnpm install
cd apps/desktop
pnpm run build:electron
codesign --verify --deep --strict --verbose=4 out/Folo-darwin-arm64/Folo.app
./out/Folo-darwin-arm64/Folo.app/Contents/MacOS/Folo
```

If you only need the packaged artifacts after code is already built:

```bash
cd apps/desktop
pnpm run build:electron-forge
```

## Notes

- If you test by opening `Folo.app` in Finder, make sure you are opening the newly generated app, not an older copy from another directory.
- For debugging local packaging issues, always trust the newest crash log and the current packaged app path together.
- If packaging succeeds but launch still fails, inspect both `codesign -dvvv` output and the runtime stderr from `Contents/MacOS/Folo`.
