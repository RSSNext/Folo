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

1. Node.js and npm are installed so the CLI can be executed with `npx`.
2. Authentication is configured:
   - `npx --yes folocli@latest login` (recommended, opens browser and auto-logins)
   - or `npx --yes folocli@latest login --token <session-token>`
   - or set `FOLO_TOKEN=<token>`

## Execution Policy

- Prefer `npx --yes folocli@latest ...` for all agent runs.
- Do not require `npm install -g folocli`.
- No separate update preflight is needed. Using `folocli@latest` is the update strategy.
- If a user already has a working global `folo` binary, it is acceptable, but `npx --yes folocli@latest` remains the recommended default in docs and automation.

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

Usage errors, such as an unknown option, a missing argument or an invalid value, use the same envelope with the code `INVALID_ARGUMENT`.

With `--verbose`, an error the API answered with also has `request`: the `method`, `path`, `originalPath`, `query` and `body` of the call, never its headers. The table and plain formats print it below the message.

You can switch output mode:

- `--format json` (default)
- `--format table` (for people: a row per item with the main fields, long values cut to one line)
- `--format plain`

Changes the API answers without data, such as `subscription remove`, `collection add`, `entry mark-read` or `list delete`, return the fields it sends: `{ "lastSyncId": 42 }` when the change was recorded for sync, otherwise `{}`. `subscription add` returns `feed`, `list`, `unread` and `lastSyncId`.

## Core Workflows

### 1. Timeline Reading

1. Fetch timeline:
   - `npx --yes folocli@latest timeline --limit 10`
2. Get entry detail:
   - `npx --yes folocli@latest entry get <entryId>`
3. Get readability content:
   - `npx --yes folocli@latest entry read <entryId>`
   - `--format plain` prints the content itself, ready to pipe or save

### 2. Subscription Management

1. Discover:
   - `npx --yes folocli@latest search discover <keyword>`
2. Add subscription:
   - `npx --yes folocli@latest subscription add --feed <url>`
   - or `npx --yes folocli@latest subscription add --list <listId>`
3. List subscriptions:
   - `npx --yes folocli@latest subscription list`
4. Update or remove one by the feed ID, list ID or feed URL it lists:
   - `npx --yes folocli@latest subscription update <id> --category <name>`
   - `npx --yes folocli@latest subscription remove <id>`
   - Both fail with `NOT_FOUND` for anything you don't follow, without changing anything.
   - Feeds of RSSHub instances are listed with `rsshub://` URLs; `remove <url> --target url` and `feed get <url>` take that URL or the one the feed was followed with.

### 3. Unread Processing

1. Check unread total:
   - `npx --yes folocli@latest unread count`
2. List unread subscriptions:
   - `npx --yes folocli@latest unread list`
   - A list counts the unread entries of all its feeds, as the app shows it, so a feed you also follow directly counts in both rows; `total` counts each entry once.
   - `total` also counts the unread entries of inboxes, which `unread count` leaves out.
3. Read unread entries:
   - `npx --yes folocli@latest timeline --unread-only --limit 20`
4. Mark read:
   - `npx --yes folocli@latest entry mark-read <entryId>`
   - or batch: `npx --yes folocli@latest entry mark-all-read --view articles`

### 4. Collection Operations

- Add: `npx --yes folocli@latest collection add <entryId>`
- Remove: `npx --yes folocli@latest collection remove <entryId>`
  - Fails with `NOT_FOUND` for an entry that isn't collected, without changing anything.
- List: `npx --yes folocli@latest collection list --limit 20`

### 5. OPML Import / Export

- Export:
  - `npx --yes folocli@latest opml export --output backup.opml`
  - A directory as `--output` gets `folo.opml` inside it.
  - Without `--output`, `data.content` holds the OPML document; `--format plain` prints the document itself.
- Import:
  - `npx --yes folocli@latest opml import feeds.opml`

## Pagination Pattern

`npx --yes folocli@latest timeline` returns:

- `entries`
- `nextCursor`
- `hasNext`

Loop until `hasNext` is `false`:

1. `npx --yes folocli@latest timeline --limit 20`
2. Read `nextCursor`
3. `npx --yes folocli@latest timeline --limit 20 --cursor <nextCursor>`
4. Repeat

A page can hold fewer entries than `--limit` while more follow, so keep going until `hasNext` is `false`; only the last page is empty. It can also hold more when several entries share the time of its last one, so that the next page misses none of them. `--limit` is at most 100. `collection list` pages the same way.

## Command Reference

- `npx --yes folocli@latest login [--timeout <seconds>] [--token <token>]`
- `npx --yes folocli@latest logout`
- `npx --yes folocli@latest whoami`
- `npx --yes folocli@latest auth login [--timeout <seconds>] [--token <token>]`
- `npx --yes folocli@latest auth logout`
- `npx --yes folocli@latest auth whoami`

- `npx --yes folocli@latest timeline [--view <type>] [--limit <n>] [--unread-only] [--cursor <datetime>]`
- `npx --yes folocli@latest timeline --feed <feedId> [--limit <n>] [--cursor <datetime>]`
- `npx --yes folocli@latest timeline --list <listId> [--limit <n>] [--cursor <datetime>]`
- `npx --yes folocli@latest timeline --category <name> [--view <type>] [--limit <n>]`

- `npx --yes folocli@latest subscription list [--view <type>] [--category <name>]`
- `npx --yes folocli@latest subscription add --feed <url> [--category <name>] [--view <type>] [--private]`
- `npx --yes folocli@latest subscription add --list <listId> [--category <name>] [--view <type>]`
- `npx --yes folocli@latest subscription remove <id> [--target feed|list|url]`
- `npx --yes folocli@latest subscription update <id> [--target feed|list] [--category <name>] [--title <title>] [--view <type>] [--private|--public]`

- `npx --yes folocli@latest entry get <entryId>`
- `npx --yes folocli@latest entry read <entryId>`
- `npx --yes folocli@latest entry mark-read <entryId>`
- `npx --yes folocli@latest entry mark-unread <entryId>`
- `npx --yes folocli@latest entry mark-all-read [--feed <feedId>] [--list <listId>] [--view <type>]`

- `npx --yes folocli@latest feed get <feedId|feedUrl>`
- `npx --yes folocli@latest feed refresh <feedId>`
- `npx --yes folocli@latest feed analytics <feedId>`

- `npx --yes folocli@latest list ls`
- `npx --yes folocli@latest list get <listId>`
- `npx --yes folocli@latest list create --title <title> [--description <desc>] [--view <type>] [--fee <n>]`
- `npx --yes folocli@latest list update <listId> [--title <title>] [--description <desc>] [--view <type>] [--fee <n>]`
- `npx --yes folocli@latest list delete <listId>`
- `npx --yes folocli@latest list add-feed <listId> --feed <feedId>`
- `npx --yes folocli@latest list remove-feed <listId> --feed <feedId>`

- `npx --yes folocli@latest search discover <keyword> [--type feeds|lists]`
- `npx --yes folocli@latest search rsshub <keyword> [--lang <lang>]`
- `npx --yes folocli@latest search trending [--range 1d|3d|7d|30d] [--view <type>] [--limit <n>] [--language eng|cmn] [--category <keyword>]`

- `npx --yes folocli@latest collection list [--limit <n>] [--cursor <datetime>]`
- `npx --yes folocli@latest collection add <entryId> [--view <type>]`
- `npx --yes folocli@latest collection remove <entryId>`

- `npx --yes folocli@latest opml export [--output <file>]`
- `npx --yes folocli@latest opml import <file> [--items <url1,url2,...>]`

- `npx --yes folocli@latest unread count`
- `npx --yes folocli@latest unread list [--view <type>]`

## Error Recovery

- `UNAUTHORIZED`
  - Re-login: `npx --yes folocli@latest login`
  - or `npx --yes folocli@latest login --token <token>`
  - Or set `FOLO_TOKEN`
- `HTTP_4xx` / `HTTP_5xx`
  - Retry with `--verbose`: `error.request` says what the call sent
  - Verify `--api-url` if using non-default endpoint
- `NETWORK_ERROR`
  - The API could not be reached; the message names its URL and the reason, such as `ECONNREFUSED`
  - Check the network connection and `--api-url`, then retry
- `TIMEOUT_ERROR`
  - The API did not answer within 30 seconds; the request may still have been carried out
  - Retry; check with the matching `list` or `get` command before repeating a change
- `INVALID_RESPONSE`
  - The server at the API URL answered as the Folo API never does, such as with a web page; the token is not to blame
  - Check `--api-url`, or leave it out to use the default API
- `INVALID_ARGUMENT`
  - Run `npx --yes folocli@latest <command> --help` to inspect accepted options
- `NOT_FOUND`
  - The id or URL names nothing the API knows; check it with the matching `list`, `get` or `search` command
