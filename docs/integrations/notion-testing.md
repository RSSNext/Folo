# Notion integration verification

Automated tests use synthetic articles and tokens, mocked OS storage, and mocked
or loopback HTTP transports. They do not write to a real Notion workspace.

## Automated coverage

- Search filtering, pagination, explicit data-source selection, cancellation and
  expiry; an existing connection remains intact until replacement succeeds.
- OS-encrypted credential persistence, refusal of unavailable/insecure storage,
  transient renderer inputs, and sanitized errors.
- Stable property-ID mapping, compatible types, duplicate-target rejection,
  schema refresh that preserves unsaved choices, and existing mapping compatibility.
- Publication timestamps retain the same instant when normalized to UTC;
  missing dates are omitted and read-only timestamp properties are rejected.
- Existing AI summaries are read from the current language and exported body
  variant's cache. Missing summaries are not generated or substituted.
- Article conversion, image import/fallback, request limits, partial exports,
  duplicate in-flight actions, and safe saved-page links.
- Settings connection/collapse/edit flows and the shared Notion SVG icon.

Run the repository's required typecheck, format, lint and test gates. Focused
commands for this feature are:

```sh
pnpm --filter @follow/electron-main exec vitest run src/lib/notion src/ipc/services/notion.test.ts
pnpm --filter @follow/web exec vitest run src/modules/settings/tabs/integration/NotionSettings.test.tsx src/modules/integration/notion-article.test.ts src/modules/command/commands/notion.test.tsx
```

The loopback client integration tests use real `fetch` with an injected local
transport, not a real Notion service. Component tests use happy-dom; they are not
full Electron UI tests. Passing these tests does not prove OS key-store access
or successful credential persistence in a packaged application.

## Manual release checklist

Use a dedicated empty database and an internal integration restricted to that
database, with read/insert capabilities. Enter credentials only in Folo. Never
put them in a PR, issue, screenshot, recording, log, or chat.

- [ ] In a normal packaged desktop build with working secure storage, connect,
      search and choose the test data source; confirm no credentials are shown
      again after successful connection.
- [ ] Map title, URL, source, author, publication date, description, existing AI
      summary and category text to compatible properties. Verify an empty
      optional value does not invent data.
- [ ] Add a writable Date property in Notion, refresh fields, and verify the
      existing unsaved mappings remain selected.
- [ ] Explicitly save one synthetic article and verify properties, body and
      images. A missing cached AI summary should warn without generating one.
- [ ] Verify the date displays the correct instant in the workspace timezone.
- [ ] Relaunch and confirm the encrypted credential can be unlocked; verify
      disconnect removes the local connection, not remote pages.
- [ ] Test a revoked integration, inaccessible data source, renamed/removed
      property, image import failure and interrupted export. If a page was
      partly saved or the response was lost, inspect Notion before retrying.
- [ ] Capture screenshots and a short demo using synthetic data only. Exclude
      tokens, private feeds, personal workspace names and account details.

Do not disable OS protections or introduce plaintext/session credential fallback
to satisfy this checklist. Failure to access a secure key store is an explicit
unsupported environment, not a successful persistence test. Web/mobile support,
OAuth, and a server-side export service are outside this implementation.
