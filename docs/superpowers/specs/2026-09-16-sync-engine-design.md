# Sync Engine Design

## Summary

This document maps the design of Linear's sync engine (as reverse-engineered in
[wzhudev/reverse-linear-sync-engine](https://github.com/wzhudev/reverse-linear-sync-engine))
onto Folo, evaluates which parts of it fit a feed reader, and lays out a phased plan for
the client (`Folo`) and the server (`follow-server`).

Phase 1 (client transaction queue) and Phase 2 (server change log, delta endpoints and
the client sync engine) are implemented. Phase 3 (push channel) is specified here so it can
be picked up without re-deriving the design.

## How Linear does it

Linear's client keeps a full copy of the workspace in IndexedDB and never writes to it
from user actions. The moving parts:

- **Sync id.** Every server-side write gets a monotonically increasing integer. The
  client stores `lastSyncId`, the highest id it has applied. Clients that share the same
  `lastSyncId` hold the same state.
- **Bootstrap.** A first launch downloads a JSONL snapshot plus `lastSyncId`. Later
  launches load from IndexedDB and ask the server for everything after `lastSyncId`
  ("local bootstrap"), so there is no full refetch.
- **Delta packets.** After bootstrap a WebSocket streams sync actions:
  `{ id, modelName, modelId, action: "I" | "U" | "D" | "A" | "V" | "C" | "G" | "S", data }`.
  Each packet advances `lastSyncId`; a gap means missed packets and triggers a catch-up.
- **Transactions.** User actions become transactions. The in-memory model is updated at
  once (optimistic), the transaction is serialized into an IndexedDB `_transaction` table,
  queued, batched, and sent as a GraphQL mutation. The mutation response carries the
  `lastSyncId` it produced; the transaction stays in `completedButUnsyncedTransactions`
  until that packet arrives. Unsent transactions are replayed after a restart.
- **Rebase.** When a delta touches a model with pending transactions, the server value
  becomes the transaction's new `original` and the local intent is re-applied on top
  (last writer wins, no operational transform).
- **Sync groups.** The server only sends packets for groups the user is subscribed to
  (their user id, their teams). Joining a team triggers a partial bootstrap of that group.
- **Partial and lazy models.** Large collections (comments, documents) are loaded on demand
  through partial indexes so the local database stays bounded.

## Where Folo stands today

Folo already has the skeleton of this architecture:

| Linear                    | Folo today                                                                    | Gap                                                                     |
| ------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Object pool + MobX models | Zustand stores per module (`@follow/store`)                                   | Equivalent                                                              |
| IndexedDB tables          | SQLite via Drizzle (`@follow/database`), one table per model                  | Equivalent                                                              |
| Local bootstrap           | `hydrateDatabaseToStore` loads SQLite into the stores on launch               | Equivalent                                                              |
| Transaction               | `createTransaction()` with `store` / `request` / `rollback` / `persist`       | Not persisted, not ordered, not retried                                 |
| `_transaction` table      | none                                                                          | Offline mutations and mutations pending at exit are lost                |
| Rebase                    | `LOCAL_READ_PROTECTION_WINDOW` (30 s timer per entry)                         | Heuristic; covers only read marks; fails past 30 s                      |
| `lastSyncId`              | none                                                                          | No way to know what changed since the last fetch                        |
| Delta packets             | none; `/entries/check-new` is deprecated and returns `false`                  | Everything is polling of full snapshots                                 |
| Bootstrap snapshot        | `/subscriptions`, `/reads`, `/entries` fetched separately with TanStack Query | Subscriptions and unread counts are replaced wholesale on every refetch |
| Sync groups               | Per-user `timeline` rows on the server                                        | Equivalent concept; no change feed                                      |

The consequences show up as workarounds spread over the client:

- `feedUnreadDirty` atoms force unread-only lists to refetch after a read mark.
- `useSyncUnreadWhenUnMatch` refetches all unread counts whenever local entries disagree
  with the count map.
- `InvalidateQueryProvider` invalidates every query when the window becomes visible after
  ten minutes.
- `subscriptionSyncService.fetch()` resets the subscription store before upserting.
- The server keeps 24 cache tags per user for subscriptions and invalidates them by hand.

## What to take from Linear, and what not to

Take:

- The transaction queue: persisted, ordered, batched, retried, rolled back only on a
  definitive rejection, with pending intent replayed on top of server data.
- The sync id and a per-user change log, so a client can ask "what changed since X" for
  the models it owns.
- Local bootstrap plus catch-up instead of full refetch on every launch.
- A push channel that tells clients a change happened, with HTTP catch-up as the source
  of truth.

Leave:

- Loading the whole workspace. Folo's entries are unbounded and mostly server-generated;
  the current cursor-paginated `timeline` queries are the right shape and stay as they are.
- Per-entry sync actions from the crawler. A feed refresh can fan out to thousands of
  subscribers; the change log must record "feed X delivered N entries to user U" rather
  than one action per timeline row.
- MobX decorators and a generic model registry. Folo has a handful of user-owned models
  (subscription, read state, collection, unread count); explicit transaction kinds are
  simpler than a metadata-driven engine.

## Phase 1: client transaction queue (implemented)

### Goals

- Read marks, unread marks, mark-all and star/unstar survive a restart and an offline
  period, and are sent in order once the network is back.
- A server snapshot fetched while a mutation is in flight can no longer undo it.
- Adjacent mutations of the same kind go to the server in one request.

### Design

`packages/internal/store/src/sync/transaction-queue.ts` is the queue. A transaction kind
declares:

```ts
interface TransactionKind<P, R> {
  kind: string
  apply(payload: P): void // optimistic, idempotent, replayed on restart
  rollback(payload: P): void | Promise<void> // only on a definitive server rejection
  execute(payloads: P[]): Promise<R> // one request for a batch
  persist?(payloads: P[], result: R) // write confirmed state to SQLite
  batchKey?(payload: P): string // adjacent transactions with equal keys batch
  overlays?(payload: P): { key; value }[] // local intent per resource, for rebase
  rebaseUnread?(payload: P, counts) // re-apply the unread delta on a server snapshot
  ackGraceMs?: number // keep overlays after the ack (replica lag)
}
```

Lifecycle:

1. `enqueue(kind, payload)` runs `apply`, appends the record to the in-memory queue, and
   inserts it into the `sync_transactions` SQLite table (migration `0038`). It resolves
   once the intent is recorded, not when the server acknowledges it.
2. A flush runs 100 ms later, or immediately on `resume()` (network back, app foregrounded).
   The head of the queue is expanded into a batch of adjacent records with the same kind
   and batch key and sent with a single `execute` call.
3. On success `persist` writes the confirmed state, the rows are deleted from the outbox,
   and the records stay visible through `getOverlays()` for `ackGraceMs` (30 s by default)
   to cover the server's read-replica lag.
4. Transport errors, timeouts, 5xx and 429 are retried with exponential backoff up to eight
   attempts. A 401 pauses the queue until the next trigger. Any other 4xx is definitive:
   `rollback` runs, the rows are deleted, and `onFailure` listeners are notified.
5. `restore()` runs after `hydrateDatabaseToStore`: rows left in the outbox are replayed
   with `apply` on top of the hydrated stores and queued for sending. Rows of unknown kinds
   are dropped.

The database only ever holds server-confirmed state. Optimistic effects live in memory and
are re-derived from the outbox on restart, which is Linear's rule that transactions never
write to the local tables directly.

Rebase happens at two read points:

- `entryActions.upsertManyInSession` consults the `entry-read:<id>` overlay and keeps the
  local read flag for entries with a pending or just-acknowledged mark.
- `unreadActions.upsertManyInSession({ fromRemote: true })` subtracts the deltas of
  pending transactions from the counts that came from the server.
- `collectionActions.reconcileFromRemote` keeps pending stars and unstars when the entry
  list response disagrees.

Transaction kinds in this phase: `reads.mark-entries-read`, `reads.mark-entry-unread`,
`reads.mark-all-read`, `collections.star`, `collections.unstar`.

### What changed for callers

- `unreadSyncService.markEntriesAsRead` and friends resolve after the intent is recorded.
  `queueEntriesAsRead` is kept as an alias; the queue batches on its own.
- `entryActions.clearLocalReadProtectionInSession` and the 30 s window are gone.
- `collectionActions.reconcileFromRemote` replaces the `upsertMany` + `delete` pair in
  `fetchEntries`.
- Logging out clears the outbox: the desktop deletes the database, the mobile app deletes
  the database file, and `resetStore` resets the queue.

### Not in this phase

- Subscription edits (`subscriptionSyncService.edit`, `batchUpdateSubscription`, category
  rename/delete) still use `createTransaction`. Their forms await the server response to
  close, so moving them needs a failure toast wired through `transactionQueue.onFailure`.
- Surfacing definitive failures in the UI. The queue emits them; nothing renders them yet.

## Phase 2: server change log and delta catch-up (implemented)

### Goals

- Replace "refetch everything on focus" with "fetch what changed since `lastSyncId`".
- Let the client learn about read marks, subscription changes, stars and new entries made
  elsewhere without polling full snapshots.
- Let mutations return a sync id so the client knows when its own change is visible.

### Data model

A per-user, append-only change log in Postgres (`packages/drizzle/src/schema/sync-actions.ts`,
migration `0122_sync_actions`):

```sql
create table sync_actions (
  id         bigserial primary key,           -- one global sequence, like Linear's lastSyncId
  user_id    text not null references "user"(id) on delete cascade,
  model      text not null,                   -- 'subscription' | 'list_subscription' | 'collection' | 'timeline'
  model_id   text,                            -- feedId / listId / entryId; null for batch timeline updates
  action     text not null,                   -- 'I' | 'U' | 'D' | 'N'
  data       jsonb,
  created_at timestamptz not null default clock_timestamp()
);
create index sync_actions_user_id_id_idx on sync_actions (user_id, id);
```

`created_at` uses `clock_timestamp()` (insert time) rather than `now()` (transaction start).
A row gets its id when it is inserted but only becomes visible when its transaction
commits, so the delta endpoint excludes rows younger than one second: a client can never
advance its cursor past an id whose row has not committed yet. Writers therefore record
their actions as the last statement of a transaction.

Rows older than 30 days are deleted by the `syncActionsCleaner` job. A cursor that predates
the retained log gets `reset: true` and the client bootstraps again. `N` rows are hints for
running clients and by far the most numerous, so they are dropped after three days: a client
that was away longer recounts its unread entries and fetches its lists anyway.

Polling must not cost database work when nothing changed, which is almost always. Writers
publish the user's newest sync id to KV (`sync:head:<userId>`), and `/sync/delta` compares it
with the cursor before anything else. To skip the authentication queries as well, the signed
session cookie of a request that authenticated is remembered as a hash
(`sync:session:<sha256>`) for five minutes, for the single purpose of deciding that there is
nothing new; that answer carries no data, and every other case authenticates as before.
Heads expire after five minutes too. The expiry bounds everything that can make a head
wrong, such as a failed publish, KV lag or two publishes landing out of order, and it is the
only signal for the crawler, whose fan-out is too large to publish per user. The price is
that a "new entries" hint can reach a running client up to five minutes late; changes made
by the user's own devices are published right away.

The crawler's fan-out is the widest write in the system, and for a popular feed nearly all
subscribers have no client running. Both delta routes therefore record presence
(`sync_presence`, one row per user, written after the response and at most every half hour
per user), and the crawler keeps `N` rows only for users whose device read the log within
the last two hours. Everyone else recounts and refetches when they come back. Collections
created by auto-star rules still go to every subscriber, because nothing recomputes them
later.

Action semantics:

| model               | action          | data                                                                                                                                                      | produced by                                                                                                         |
| ------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `subscription`      | `I`             | the subscription row plus `feeds` (the feed row)                                                                                                          | `POST /subscriptions`; one per feed really added by `POST /subscriptions/import`                                    |
| `subscription`      | `U`             | the patched fields                                                                                                                                        | `PATCH /subscriptions`, `PATCH /subscriptions/batch`, `/categories`                                                 |
| `subscription`      | `D`             | none                                                                                                                                                      | `DELETE /subscriptions`, `DELETE /categories` with `deleteSubscriptions`                                            |
| `list_subscription` | `I` / `U` / `D` | the list subscription row plus `lists` (with `owner.id`)                                                                                                  | same routes, list branch; `POST /lists` for the owner; `U { view }` for every subscriber when the list view changes |
| `collection`        | `I` / `D`       | `{ entryId, feedId, view, createdAt }`                                                                                                                    | `/collections`, auto-star rules in the crawler                                                                      |
| `timeline`          | `U`             | `{ entryIds, read, isInbox, feeds }` for rows that really flipped, 500 ids per row; `feeds` counts them per feed id or inbox handle                       | `POST /reads`, `DELETE /reads`, `POST /reads/all`                                                                   |
| `timeline`          | `N`             | `{ feedId, count, unread, latestPublishedAt, from }`; `count` is rows really inserted, `unread` those inserted as unread; entry ids are not repeated here | crawler fan-out, one row per (user, feed) per refresh                                                               |
| `timeline`          | `N`             | `{ inboxId, isInbox: true, count, unread, latestPublishedAt }`                                                                                            | new inbox entry from `/inboxes/email` or `/inboxes/webhook`                                                         |
| `list`              | `U`             | the patched fields, or `{ feedIds }` when membership changed                                                                                              | `PATCH /lists`, `POST /lists/feeds`, `DELETE /lists/feeds`; sent to the owner and every subscriber                  |
| `list`              | `D`             | none                                                                                                                                                      | `DELETE /lists`; sent to the owner and every subscriber, who also drop their subscription                           |
| `inbox`             | `I` / `U` / `D` | the inbox in `GET /subscriptions` shape, `{ title }`, none                                                                                                | `/inboxes`                                                                                                          |
| `inbox_entry`       | `D`             | `{ inboxId, unread }`, `unread` says whether the deleted entry was unread                                                                                 | `DELETE /entries/inbox`                                                                                             |
| `action`            | `U`             | `{ rules }`, the whole rules document                                                                                                                     | `PUT /actions`                                                                                                      |
| `setting`           | `U`             | `{ payload, updatedAt }` for the tab in `modelId`, as `GET /settings` returns it; tabs that hold credentials (`ai`) carry only `{ updatedAt }`            | `PATCH /settings/:tab`                                                                                              |
| `messaging`         | `U` / `D`       | `{ channel }`, never the token                                                                                                                            | `POST /messaging`, `DELETE /messaging`                                                                              |

`N` ("new entries arrived") is the coalesced form of Linear's `I` for timeline rows. The
crawler writes it after its fan-out transaction commits, in one statement for all
subscribers, so the log never slows the hot path and a lost hint only costs a later
refresh. Entries themselves keep coming through the paginated `/entries` endpoint.

List and inbox writes are fan-out hints recorded after the primary change committed; they
go through `recordSyncActionsSafely`, so a failed log write never fails the request.

A subscription delete without an explicit type removes both the feed and the list
subscription with that id on the server, so it logs one `D` per model; the client ignores
the one it does not hold.

Unread counters are derived on the server, and a client that holds only part of the
timeline cannot recompute them. The log therefore carries the numbers a client needs to
move its counters: read mutations update only rows whose state flips
(`WHERE read = <old>` ... `RETURNING feed_id`) and log the flips per feed, and the crawler
reports the rows its `ON CONFLICT DO NOTHING` insert really wrote. These are increments,
so they commute and the order of pages does not matter. A read mutation that flips
nothing writes no action and answers with the user's current `lastSyncId`; a retried
request therefore settles exactly like its first attempt.

### Routes

Implemented for both the Node app (`routes/sync/*.ts`) and the Worker
(`routes/sync/index.worker.ts`), with `/sync` in `migratedWorkerRouteGroups`.

`GET /sync/state` returns `{ lastSyncId }`. The client fetches it before taking a snapshot.
A replica may report a lower id than the primary, which only makes the client replay a few
actions twice; every action is idempotent so a lower cursor is always safe.

`GET /sync/delta?lastSyncId=N&limit=500` returns

```json
{
  "code": 0,
  "data": {
    "actions": [
      {
        "id": 123457,
        "model": "timeline",
        "modelId": "feed-1",
        "action": "N",
        "data": {
          "feedId": "feed-1",
          "count": 4,
          "latestPublishedAt": "...",
          "from": ["feed"],
          "entryIds": ["..."]
        },
        "createdAt": "..."
      },
      {
        "id": 123458,
        "model": "subscription",
        "modelId": "feed-2",
        "action": "U",
        "data": { "category": "Tech" },
        "createdAt": "..."
      }
    ],
    "lastSyncId": 123458,
    "hasMore": false,
    "reset": false
  }
}
```

Mutation responses of the logged routes carry `lastSyncId`, the highest id they produced.

Bootstrap deliberately reuses the existing snapshot endpoints instead of a new bundle:
the client reads `/sync/state`, then `/subscriptions` and `/reads`, and stores the id it
read first. Anything written between the two calls is replayed by the next delta.

### Client

`packages/internal/store/src/sync/sync-engine.ts`:

- `start()` runs after `transactionQueue.restore()` in `hydrateDatabaseToStore`. It loads
  the cursor from the `sync_meta` SQLite table (migration `0039`), attaches the triggers
  and pulls.
- `pull()` bootstraps when there is no cursor, otherwise pages through `/sync/delta` and
  applies each action: subscription `I`/`U`/`D` update the subscription, feed and list
  stores and SQLite; collection `I`/`D` update the collection store; timeline `U` flips the
  read flag of local entries, skipping entries with a pending local mark (the transaction
  queue's overlay wins); timeline `N` marks the feed or inbox dirty; `list` `U`/`D` patch
  or remove the list (and its subscription), refreshing the list's timeline when membership
  changed; `inbox` `I`/`U`/`D` and `inbox_entry` `D` keep inboxes and their entries in step.
- After every cursor advance the engine calls `transactionQueue.markSynced(lastSyncId)`.
  Acknowledged transactions carry the `lastSyncId` their mutation returned and release
  their overlays as soon as the engine has applied that id. The 30 s window only remains
  as the upper bound for responses without a sync id or a server without `/sync`.
- `sync/sync-status.ts` exposes whether the engine is active. While it is,
  the desktop `InvalidateQueryProvider` skips the `entries`, `subscription` and `unread`
  queries, because the engine pulls on every return to the app and fetches only what
  changed.
- Unread counters are kept in two layers, the way Linear keeps a confirmed model under its
  local transactions. The confirmed counts are moved by snapshots and by the numbers in the
  log (`feeds` on `U`, `unread` on `N` and on `inbox_entry` `D`) and are the only thing
  written to SQLite. The displayed counts are the confirmed ones with every unsettled local
  transaction rebased on top: queued transactions, plus acknowledged ones whose `lastSyncId`
  the engine has not reached. A transaction never has to predict its real effect: when the
  log reports what the server flipped, the prediction is dropped. Marking whole feeds as
  read confirms zero directly, and later flips are clamped at zero. Without a change log
  (`awaitsSync` is false in `persist`) the prediction is committed instead, as before.
- With a cursor in place the local database plus the delta feed is the state, so nothing
  fetches full snapshots for freshness. `usePrefetchSubscription`, `usePrefetchUnread`,
  pull to refresh, the refresh button, OPML import, unsubscribe and the mobile background
  task all go through `ensureSynced()` / `catchUp()` (reached via `sync/sync-status.ts` to
  stay free of import cycles) and only fall back to `/subscriptions` and `/reads` when the
  engine cannot help: logged out, no cursor yet, or a server without `/sync`.
- Snapshots are taken again only as calibration, for what the log cannot express: `/reads`
  at most hourly, because unread entries age out of the retention window without an
  action, and `/subscriptions` daily, because feed metadata is not owned by the user. A
  recount also follows actions that change counters structurally (a subscription or list
  membership added) or that come from a server that does not send the numbers yet, a
  refresh the user asks for (the desktop refresh button, pull to refresh on mobile), and
  `useSyncUnreadWhenUnMatch` asks for one, at most once a minute, when the list on screen
  disagrees with the counter after a delta pull: it shows more unread entries than the
  counter, or it is an unread-only list with no more pages and shows fewer.
- An unread snapshot is paired with the sync id it reflects. `GET /reads` answers with
  `lastSyncId`, read on the same replica after the counts, so every action up to it had its
  change inside the counts; an older server gets `/sync/state` read just before instead.
  The engine keeps that id in `sync_meta` (`unreadSnapshotSyncId`) and applies the counter
  part of `N`, `U` and `inbox_entry` `D` actions only above it. Without this the log double
  counts: a poll answered from a stale head, or a snapshot that simply ran before the pull
  carrying the hints, put the snapshot ahead of the cursor, and the `N` increments that
  followed were added on top of counts that already contained the entries.
- New entries never rearrange what is loaded. On launch, foreground and manual pulls the
  engine fetches only the edge of the entry lists on screen where new entries arrive
  (`refreshEntriesHead`): the first page of a newest-first list, merged in front of the
  loaded pages (`mergeEntriesHead`), or the page after the last entry of an oldest-first
  list that was scrolled to its end (`trimTrailingEmptyPages`). Lists fetched after the
  `N` was logged are skipped. Background pulls leave lists alone while the user reads and
  remember the views instead, so the next return to the app catches up even if that
  pull finds nothing new. "Return" means the document becoming visible, the window
  gaining focus (a desktop window keeps its visibility when the user switches apps), the
  network coming back, or the mobile app becoming active.
  Structural changes still invalidate the affected lists. `useEntriesQuery().refetch` trims
  the infinite query to its first page first, so a refresh costs one request instead of one
  per loaded page.
- Models the engine does not own register through `sync/model-registry.ts`
  (`registerSyncModel(model, { bootstrap, apply })`), which has no runtime imports so apps
  and store modules can use it freely. A model is loaded in full once per account (flag
  `bootstrapped:<model>` in `sync_meta`), again after a reset, and again when its actions
  went by before a handler was registered; from then on only `apply` runs. Registered
  today: `action` in the store (the rules document is kept in `sync_meta` under
  `model:action` and hydrated at start, and unsaved edits are never replaced), `setting`
  in each app's settings sync queue (one tab goes through the same last-writer-wins merge
  as a full sync, a tab with a queued local change is skipped, and a tab logged without its
  payload is read through `GET /settings`), and `messaging` in the desktop web build.
- Launch therefore no longer requests `/actions` or `/settings`, and the web build only
  registers its push token when the token changed or a later `messaging` action shows that
  another browser took over the channel: the server keeps one token per user and channel,
  and a registration answers with its sync id so a browser recognises its own.
- Triggers: launch, `online`, `visibilitychange`, app foreground on mobile, a 60 s interval
  while visible, and 1.5 s after the transaction queue receives an acknowledgement.
- A 404 from `/sync/state` or `/sync/delta` marks the engine unavailable for the session,
  so a client running against an older server keeps today's full refetch behaviour.
- The apps hand `followApi.sync` from the client SDK (0.3.96 and later) to the store through
  `syncApiContext`.

### Still to do

- Delete the full-request fallbacks (`subscriptionSyncService.fetch` in the prefetch hook,
  the `feedUnreadDirty` atoms, the sync-managed part of `InvalidateQueryProvider`) outright
  once every deployed server exposes `/sync`. Today they serve servers without it.
- `subscription` `I` still triggers a recount, because the seeded timeline rows of a new
  subscription are not reported. Carrying the number of rows inside the retention window
  would remove the last routine `/reads` request.
- Phase 3 below, so other devices learn about a change without waiting for their next pull.

## Phase 3: push channel

Linear pushes deltas over a WebSocket. On Cloudflare the equivalent is a per-user Durable
Object with the WebSocket hibernation API, which the AI chat stream already uses
(`AiChatStreamDurableObject`). The server does not need to push the actions themselves: a
`{ "lastSyncId": 123458 }` poke is enough, and the client runs `pull()`. This keeps the
HTTP delta endpoint as the only source of truth and makes reconnects trivial.

Mobile keeps the existing FCM channel (`sendNewEntryNotification`) and adds a silent data
message with the same poke so background fetches can catch up.

## Rollout notes

- Phase 1 needs no server change and can ship on its own.
- Phase 2 ships server first (migration `0122`, then the Worker deploy) and the client
  second. A client that reaches an older server gets 404 from `/sync/state` and keeps
  today's full refetch behaviour for that session.
- `sync_actions` grows with user activity, not with crawl volume, because timeline inserts
  are coalesced. Expected volume is well under one row per timeline insert.

## Open questions

- Whether `N` actions should carry the new entry ids (bounded to, say, 50) so the client can
  avoid a list refetch when the feed is on screen.
- Whether list subscriptions and inbox entries need their own `N` actions or can reuse the
  feed one with `from`.
- Retention of `sync_actions` for paid users beyond the timeline window.
