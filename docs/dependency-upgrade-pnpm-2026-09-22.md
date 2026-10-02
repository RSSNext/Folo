# pnpm 12 migration — 2026-09-22

The frontend toolchain moves from pnpm 10.17.0 to 12.5.1. Package versions and the already-reviewed patches must remain unchanged.

## Reviewed evidence

Read the [v11 release](https://github.com/pnpm/pnpm/releases/tag/v11.0.0), [v12 release](https://github.com/pnpm/pnpm/releases/tag/v12.0.0), [12.5.1 release](https://github.com/pnpm/pnpm/releases/tag/v12.5.1), and [official migration guide](https://pnpm.io/migration). Reused the backend review of intervening releases and independently read the 881-line focused [upstream source diff](https://github.com/pnpm/pnpm/compare/v10.12.4...v12.5.1) for config routing, known settings, bootstrap registry isolation and workspace warnings. The earlier 10.12.4 diff boundary includes the frontend's 10.17.0 starting version. Raw evidence is in `/tmp/follow-tooling-audit/pnpm__pnpm`; empty legacy TypeScript-path diffs are not source evidence because these paths moved to Rust, and the focused Rust diff is the actual record.

Configuration now comes from camelCase workspace settings; `.npmrc` retains only registry/auth roles. Unknown settings fail when the pinned CLI is running. Build scripts require explicit allow/deny decisions. Failed patches always fail; the old opt-out key no longer exists. The default one-day release-age gate remains active. Frozen installs can consume existing lockfiles without re-resolving cyclic peer graphs. The local validation uses Node 24.15.0.

## Adaptation

- Preserve `nodeLinker: hoisted`, `shamefullyHoist: true`, and `saveExact: true` by moving the three existing `.npmrc` fields into `pnpm-workspace.yaml`.
- Translate the existing build allowlist into `allowBuilds` without allowing every package. Additional lifecycle decisions, if required by the clean install, are recorded below.
- Remove `ignorePatchFailures: false`, keeping the new mandatory failure behavior.
- Update the root package-manager pin. GitHub workflows already obtain their version from this field.
- Keep the EAS jobs on the same workspace `hoisted` layout as their initial install. The first publication exposed that renaming the legacy linker environment overrides to `pnpm_config_*` activated an unsafe mid-command layout change; those overrides are removed in the follow-up below.
- Keep all dependency manifests, override versions, and patch contents unchanged during this migration.

## Validation

- `pnpm install --frozen-lockfile` completed on pnpm 12.5.1 / Node 24.15.0. The full lockfile SHA-256 is identical before and after migration; no direct or transitive versions were re-resolved. All 3,654 lock entries passed policy verification. Evidence: `/tmp/folo-pnpm12-install-final.log` and `/tmp/folo-pnpm12-lock-before.sha256`.
- The initial policy check rejected 40 exact versions published within its one-day window. The workspace lists only those exact versions from the already-installed, reviewed dependency graph under `minimumReleaseAgeExclude`; the default age policy remains active for every other version.
- Preserve the previous blocked-script behavior for `@parcel/watcher`, `@swc/core`, `better-sqlite3`, and `node-pty` with explicit `false` decisions. `workerd` is explicitly allowed to validate/link its platform executable. `pnpm why` confirms SQLite's Node binding is only a transitive server-adapter dependency and node-pty belongs to the optional editor-launch inspector, neither is imported by application source. SWC's platform binary performs a real TypeScript transform, Parcel's native watcher loads, and the installed workerd binary reports `2026-09-21`.
- Root, mobile, desktop renderer and landing resolve the same physical React 19.2.8 package. The effective compiler remains TypeScript 6.0.3.
- Compared 1,161 generated/native/HTML-renderer files. Only Expo SQLite's generated `ios/sqlite3.c` and `.h` were removed by relinking; all other bytes, including the complete `out/rn-web`, are unchanged. The native validation owner was notified to regenerate those files with CocoaPods before the next native build.
- Full typecheck passed 20/20 tasks under pnpm 12; full lint passed with 977 warnings and no errors. Full tests passed again: 93 files, 524 tests, with 2 pre-existing CLI tests skipped. Log: `/tmp/folo-pnpm12-test.log`.

- Post-install browser and Electron E2E: 3/3 passed in 3.9 minutes using Playwright 1.63 and its bundled Chromium 153. Electron 44 rebuilt under the new install and passed IPC, native clipboard text/PNG, registration, logout/restart/login, follow/unfollow and read-state checks. Browser core flow and two-session settings sync also passed. Log: `/tmp/folo-pnpm12-e2e.log`.

- Fresh pnpm 12 installation correctly omits `electron-windows-store` on macOS. This exposed a top-level AppX maker import in Forge configuration. The Windows Store maker now uses Forge's lazy `name`/`config` registration inside the existing Microsoft Store branch, so macOS configuration loading no longer imports a Windows-only package. Its publisher, assets, identity and protocol configuration are retained.
- After that fix, the unsigned macOS arm64 `.app` was rebuilt from the pnpm 12 tree and launched. Its asar resolves jsdom 30 (including computed CSS and Unicode HTML), font-list and language detection; the preload IPC bridge works. Logs: `/tmp/folo-pnpm12-package.log`, `/tmp/folo-pnpm12-packaged-runtime.log`. No signing/notarization or publishing occurred.

## Dev CI follow-up: mobile config evaluation

The first dev publication (`2f392594d5ab02c35707f4f0639e3abcb50d37b2`) passed the full quality workflow, desktop builds on macOS/Linux/Windows, and all three Cloudflare deployments. The Android, iOS and iOS development workflows failed before native compilation, while running Expo `config --json` ([Android log](https://github.com/RSSNext/Folo/actions/runs/35704331868)).

The HTML build wrapper changes its directory again to `apps/mobile/web-app/html-renderer`. Its workflow argument `../../../out/rn-web/html-renderer` therefore wrote to `apps/out`, while the Expo asset plugin requires repository-root `out/rn-web`. Existing local output had concealed this clean-checkout discrepancy. All six mobile jobs now pass the quoted absolute `${{ github.workspace }}/out/rn-web/html-renderer` path.

A clean fixture also reproduced the dependency-layout failure: the asset plugin's fallback invokes `pnpm build` during Expo configuration. Under pnpm 12, the EAS step's `pnpm_config_node_linker=isolated` and `pnpm_config_shamefully_hoist=false` trigger an automatic install before the script, replacing the hoisted modules while Expo is still using them. The HTML build then loses hoisted icon/Tailwind resolution, and Expo's error handler loses `chalk`. The three workflows now remove these conflicting overrides and preserve `nodeLinker: hoisted` / `shamefullyHoist: true` from the workspace for the entire build. No dependency versions change.

The initial diagnostic fixture used source symlinks, so its automatic install also relinked the local workspace. The owner stopped the affected quality run and restored the standard hoisted tree with `pnpm install --frozen-lockfile`; the lockfile is byte-identical to the published SHA and Expo/CLI/chalk resolution is restored. Evidence: `/tmp/folo-ci-expo-clean-fixture-error.log` and `/tmp/folo-ci-layout-restore-install.log`. The first repair restored root modules but left an obsolete package-local Vitest shim from the isolated layout; the subsequent test failed before running tests (`/tmp/folo-ci-layout-stale-bin-test-failure.log`). All generated workspace `node_modules` directories were therefore removed and restored from the same frozen lockfile to eliminate the mixed layout. These failed-run records are retained; interrupted or failed checks are not counted as successful validation.

The corrected absolute renderer build was exercised both directly with Vite and through the exact `pnpm --dir apps/mobile/web-app build --outDir <absolute-path>` wrapper. A fixture with no initial root `out` then passed Expo `config --json` under CI's Node 22.23.2, `env -i`, and `EXPO_NO_DOTENV=1`, with no `pnpm` available on PATH: valid SDK 57 / 24-plugin JSON and empty stderr prove the asset fallback was not invoked. Both lockfile and module-layout metadata stayed unchanged. Logs: `/tmp/folo-ci-absolute-assets-build.log`, `/tmp/folo-ci-absolute-pnpm-assets-build.log`, `/tmp/folo-ci-expo-absolute-assets-error.log`.

After the clean restoration, the ordered root checks passed: typecheck 20/20 tasks, lint 0 errors / 977 warnings, tests 130 files / 688 passed / 2 existing skips with no unhandled errors, and whole-repository formatting. Evidence: `/tmp/folo-ci-layout-clean-install.log` and `/tmp/folo-dev-assets-fix-{typecheck,lint,test,format}.log`. A structural check parsed all three workflow YAML files and verified every renderer output path and the absence of conflicting linker overrides. Remote CI results for the follow-up commit are verified separately from these local checks.
