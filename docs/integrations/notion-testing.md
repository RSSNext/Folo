# Notion desktop preview: verification notes

These checks use synthetic content and synthetic, non-secret token strings.
They do not connect to a real Notion workspace.

## Automated checks

- All 21 monorepo typecheck tasks passed with `pnpm exec turbo typecheck --concurrency=1`.
- The initial full lint command exceeded the container's memory. Its constituent
  TSSlint projects and ESLint directory partitions passed sequentially with
  `NODE_OPTIONS=--max-old-space-size=2800`: zero errors, existing warnings remain.
- Main-process and renderer unit suites pass independently. The monorepo test
  command's embedded renderer typechecker was killed under parallel memory
  pressure; separate renderer typecheck and runtime test runs passed.
- `client.integration.test.ts` runs a real loopback HTTP server and real `fetch`,
  routed through the client's injected transport. It checks API version/auth
  headers, data source lookup, async image import, page properties, 100-block
  batching, source/link preservation and permission denial without writes.
- Renderer component tests cover configuration, disconnection, transient token
  clearing, duplicate actions, safe errors, save payloads and partial-save links.

## Actual Electron storage boundary

Electron 44.4.3 was launched on Linux with a fresh temporary profile using
`--headless --ozone-platform=headless`. The real Electron runtime reported
`isEncryptionAvailable() === false` and `getSelectedStorageBackend() === "basic_text"`.
The bundled production `NotionService.configure` rejected a synthetic credential
with the secure-storage error; `getStatus()` remained unconfigured. This proves
refusal of insecure storage in this environment, **not** successful encryption
with macOS Keychain or a working Linux secret service.

## Before using a real workspace

A live Notion/desktop smoke test remains required. Use a dedicated empty test
page/database and a Notion internal integration restricted to that database.
Grant read/insert content capabilities, connect it to the test database, and enter
the token locally in Folo's integration settings. Do not paste the token into an
issue, PR, log or chat. The present preview accepts a data source ID, not a database
URL. See Notion's database/data source documentation for obtaining that ID.

Saving a synthetic article will create a page in that selected test database and
may upload its public image to Notion. Verify title/source/body/image persistence,
relaunch Folo to verify the locally encrypted credential can be unlocked, then
disconnect. Disconnect removes Folo's stored credential but does not revoke the
Notion integration or delete saved pages. Revoke the test integration in Notion
and remove the synthetic test page when no longer needed.

No real workspace write, OAuth/database-picker flow, full-app screenshot or
successful macOS Keychain test is implied by the automated tests above.

## GUI execution limit in this cloud workspace

A real `NotionSettings` component fixture was bundled for Electron. BrowserWindow
renderer startup failed with exit 139 and Chromium's `could not fork: process_type
renderer`/`Broken pipe` errors, including a retry with hardware acceleration off
and a temporary XDG/profile directory. No sandbox, context isolation or web
security protections were disabled. System Chromium also failed its singleton
socket startup. Consequently the interactive React tests use the repository's
happy-dom environment; these are **not** full Electron UI tests or screenshots.
