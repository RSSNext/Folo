# Save articles to Notion (desktop preview)

This integration adds **Save to Notion** to the desktop article toolbar and a
Notion section in **Settings → Integrations**. It is not available in the web or
mobile app. This first implementation uses a Notion internal integration, not
Notion OAuth or the AI MCP connection.

## Setup

1. Create a Notion internal integration with read and insert content capabilities.
2. Share the target database with that integration in Notion.
3. Enter the integration token and target **data source ID** in Folo's Notion
   integration settings. A database URL/ID is not a data source ID; obtain it from
   Notion's database/data source information. For API context, see
   <https://developers.notion.com/docs/upgrade-guide-2025-09-03>.
4. Connect. Folo validates access and discovers the existing title property. It
   does not create or modify database properties.
5. Customize the article toolbar to add **Save to Notion**, then save an article.

The token is encrypted with Electron `safeStorage` in the desktop main process.
It is never returned through IPC, included in exported integration settings, or
stored in browser localStorage. If secure OS storage is unavailable (including
Linux's `basic_text` fallback), connection is refused. Disconnect removes the
local encrypted credential; revoke the integration in Notion to revoke access.

## Saved content

- Page title uses the data source's existing title property.
- Original URL and feed/source name are retained at the top of the page body.
- Text, headings, lists, quotes and images are converted to native Notion blocks.
  Inline styling and complex table/code formatting are flattened to text. Link
  destinations and table row/cell separators are retained. This is not a pixel-identical HTML archive.
- Public HTTPS images are imported with Notion's official File Upload API and
  attached as `file_upload` blocks. No Folo image hosting is introduced.
- If an import fails (for example, the origin blocks Notion, exceeds its limits,
  or times out), the external image URL is retained and a warning is shown. Such
  images are **not archived** and can expire. Local, IP-literal and non-HTTPS
  image URLs are omitted. The original article remains linked.
- Long articles are appended in batches. On partial failure, the created page
  URL is returned with a warning instead of claiming a complete save.

Only an explicit save click sends the article to Notion. Starring an article
never exports it. Concurrent duplicate saves are blocked, but a later explicit
save creates another page. A lost network response is never retried automatically;
check Notion before retrying to avoid duplicate pages.

## Development and remaining review

Unit tests use synthetic content and mocked network/OS storage. No personal
Notion workspace, token, or live page is needed. Run the Electron main tests and
renderer tests, typecheck, lint and format checks using the repository guidance.
A real desktop/Notion smoke test is still required for OS key-store behavior,
connection permissions, image imports, UI screenshots and interrupted workflows.

Before upstream acceptance, maintainers should decide whether this desktop-only
internal-integration approach fits Folo, or whether OAuth and a server-side
export service are preferred. Database selection UI, custom field mappings,
rich inline formatting and cross-platform support are not implemented here.
