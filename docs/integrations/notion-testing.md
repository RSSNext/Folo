# Notion desktop preview: verification notes

Tests use synthetic content and token strings, not a real Notion workspace.

## Current local credential design

New connections persist unencrypted in device-local `localStorage` at
`follow:integration:notion`. The key is separate from account-synced settings and
exports. API requests remain in the main process. Automated tests cover successful
selection persistence and restart hydration, draft cancellation, query status
without secrets, local-write failure rollback, disconnect, and namespace cleanup.
Main-process tests cover legacy encrypted compatibility, explicit migration,
credential validation, schema mapping, dates, limits, and missing AI summaries.

The old encrypted configuration remains intact until replacement local storage
succeeds. Legacy mappings can be edited without exporting the legacy token.
New connections do not require an OS key store; this is an explicit unencrypted
storage choice, not a secure-store fallback. Software or people with profile
access can read it. No token belongs in PR logs or screenshots.

## Verification boundaries

Legacy encrypted connections still depend on OS secure storage. Mock tests do
not validate actual Keychain behavior. Local development testing reported by the
user is not production-packaged validation. Automated tests do not establish
successful real workspace writes or full Electron UI behavior.

Focused commands (from the repository root):

```sh
pnpm --dir apps/desktop/layer/main exec tsc
pnpm --dir apps/desktop/layer/renderer exec tsc --noEmit
pnpm --dir apps/desktop/layer/main exec vitest run
pnpm --dir apps/desktop/layer/renderer exec vitest run src/modules/integration/notion-local.test.ts src/modules/settings/tabs/integration/NotionSettings.test.tsx src/modules/command/commands/notion.test.tsx src/modules/integration/notion-article.test.ts
```

Local persistence tests recreate the client against the same synthetic storage;
they are not an actual Electron restart test.

Before release, use a dedicated empty database and restricted test integration.
Enter the token locally, select the target, save synthetic content, relaunch and
verify persistence. Check disconnect and sign-out remove the connection; verify
another account never inherits the prior connection. Test legacy migration with
both available and unavailable secure storage without logging credentials.

For mappings, include a writable Date property and confirm offset-bearing times
preserve their instant. Creation/edit timestamps are read-only. Refresh schema
must preserve unsaved selections. Test existing AI-cache summaries and missing
language/body versions without invoking generation. Check public image imports,
partial-write warnings and duplicate-page risk after uncertain network failures.

Run repository typecheck, lint, format and focused main/renderer suites before
submission. Record actual results for the exact candidate commit separately;
this document does not claim all release checks or real-account tests passed.
