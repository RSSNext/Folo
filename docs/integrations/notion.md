# Save articles to Notion (desktop preview)

This integration adds **Save to Notion** to the desktop article toolbar and a
Notion section in **Settings → Integrations**. It is not available in the web or
mobile app. This first implementation uses a Notion internal integration, not
Notion OAuth or the AI MCP connection.

## Setup

1. Create a Notion internal integration with read and insert content capabilities.
2. Share the target database with that integration in Notion.
3. Enter the integration token in Folo's Notion integration settings and connect.
4. Search the databases/data sources accessible to the integration and select a
   target explicitly. Results are paginated; multiple sources are not selected
   automatically. Empty results can mean the database has not been shared or
   Notion's search index has not updated yet. A failed or cancelled selection
   leaves the existing saved connection intact. Selection drafts expire after
   ten minutes. API version: `2025-09-03`.
5. Optionally open field mapping. Title is automatic; map URL to a URL property,
   publication time to a writable Date property, and source, author, original
   description, existing AI summary and categories to rich-text properties.
   Created time and Last edited time are read-only and cannot be mapped.
6. Customize the article toolbar to add **Save to Notion**, then save an article.

Connected settings collapse credential controls; use **Edit connection** to change
connections. **Refresh fields** reloads schema without losing unsaved mappings.
Mappings use stable property IDs and validate type compatibility before writes.
The integration never creates or modifies the remote database schema.

The token is encrypted with Electron `safeStorage` in the desktop main process.
It is never returned through IPC, included in exported integration settings, or
stored in browser localStorage. If secure OS storage is unavailable (including
Linux's `basic_text` fallback), connection is refused. Disconnect removes the
local encrypted credential; revoke the integration in Notion to revoke access.

## Saved content

- Page title uses the data source's existing title property.
- Optional mapped metadata skips absent values. Dates preserve the original instant
  while serializing to UTC ISO 8601. Original descriptions become plain text;
  categories are comma-separated text, not new select options.
- AI summary is read only from the existing completed cache for the current
  language and the actual exported body version. Missing cache produces a warning
  and skips the field. Saving never generates a summary or invokes a paid AI API.
- Oversized mapped content is rejected rather than silently truncated.
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
export service are preferred. Rich inline formatting and web/mobile support remain outside this preview.
Development login bridges and session-only credential fallbacks are not included.
