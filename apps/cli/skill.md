# Folo CLI Skill

## Trigger Conditions

Use this skill when a user asks to:

- Manage RSS subscriptions
- Browse timeline entries
- Read entry details or readability content
- Mark entries as read/unread
- Search feeds/lists or trending sources
- Import/export OPML
- Check unread counts

## Preconditions

1. Folo CLI is installed and executable as `folo`.
2. Authentication is configured:
   - `folo auth login --token <session-token>`
   - or set `FOLO_TOKEN=<token>`

## Output Contract

Default output is JSON with a stable envelope:

```json
{
  "ok": true,
  "data": {},
  "error": null
}
```

Errors return:

```json
{
  "ok": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token is invalid or expired."
  }
}
```

You can switch output mode:

- `--format json` (default)
- `--format table`
- `--format plain`

## Core Workflows

### 1. Timeline Reading

1. Fetch timeline:
   - `folo timeline --limit 10`
2. Get entry detail:
   - `folo entry get <entryId>`
3. Get readability content:
   - `folo entry read <entryId>`

### 2. Subscription Management

1. Discover:
   - `folo search discover <keyword>`
2. Add subscription:
   - `folo subscription add --feed <url>`
   - or `folo subscription add --list <listId>`
3. List subscriptions:
   - `folo subscription list`

### 3. Unread Processing

1. Check unread total:
   - `folo unread count`
2. List unread subscriptions:
   - `folo unread list`
3. Read unread entries:
   - `folo timeline --unread-only --limit 20`
4. Mark read:
   - `folo entry mark-read <entryId>`
   - or batch: `folo entry mark-all-read --view articles`

### 4. Collection Operations

- Add: `folo collection add <entryId>`
- Remove: `folo collection remove <entryId>`
- List: `folo collection list --limit 20`

### 5. OPML Import / Export

- Export:
  - `folo opml export --output backup.opml`
- Import:
  - `folo opml import feeds.opml`

## Pagination Pattern

`folo timeline` returns:

- `entries`
- `nextCursor`
- `hasNext`

Loop until `hasNext` is `false`:

1. `folo timeline --limit 20`
2. Read `nextCursor`
3. `folo timeline --limit 20 --cursor <nextCursor>`
4. Repeat

## Command Reference

- `folo auth login --token <token>`
- `folo auth logout`
- `folo auth whoami`

- `folo timeline [--view <type>] [--limit <n>] [--unread-only] [--cursor <datetime>]`
- `folo timeline --feed <feedId> [--limit <n>] [--cursor <datetime>]`
- `folo timeline --list <listId> [--limit <n>] [--cursor <datetime>]`
- `folo timeline --category <name> [--view <type>] [--limit <n>]`

- `folo subscription list [--view <type>] [--category <name>]`
- `folo subscription add --feed <url> [--category <name>] [--view <type>] [--private]`
- `folo subscription add --list <listId> [--category <name>] [--view <type>]`
- `folo subscription remove <id> [--target feed|list|url]`
- `folo subscription update <id> [--target feed|list] [--category <name>] [--title <title>] [--view <type>] [--private|--public]`

- `folo entry get <entryId>`
- `folo entry read <entryId>`
- `folo entry mark-read <entryId>`
- `folo entry mark-unread <entryId>`
- `folo entry mark-all-read [--feed <feedId>] [--list <listId>] [--view <type>]`

- `folo feed get <feedId|feedUrl>`
- `folo feed refresh <feedId>`
- `folo feed analytics <feedId>`

- `folo list ls`
- `folo list get <listId>`
- `folo list create --title <title> [--description <desc>] [--view <type>] [--fee <n>]`
- `folo list update <listId> [--title <title>] [--description <desc>] [--view <type>] [--fee <n>]`
- `folo list delete <listId>`
- `folo list add-feed <listId> --feed <feedId>`
- `folo list remove-feed <listId> --feed <feedId>`

- `folo search discover <keyword> [--type feeds|lists]`
- `folo search rsshub <keyword> [--lang <lang>]`
- `folo search trending [--range 1d|3d|7d|30d] [--view <type>] [--limit <n>] [--language eng|cmn] [--category <keyword>]`

- `folo collection list [--limit <n>] [--cursor <datetime>]`
- `folo collection add <entryId> [--view <type>]`
- `folo collection remove <entryId>`

- `folo opml export [--output <file>]`
- `folo opml import <file> [--items <url1,url2,...>]`

- `folo unread count`
- `folo unread list [--view <type>]`

## Error Recovery

- `UNAUTHORIZED`
  - Re-login: `folo auth login --token <token>`
  - Or set `FOLO_TOKEN`
- `HTTP_4xx` / `HTTP_5xx`
  - Retry with `--verbose` for request details
  - Verify `--api-url` if using non-default endpoint
- `INVALID_ARGUMENT`
  - Run `folo <command> --help` to inspect accepted options
