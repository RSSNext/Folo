/**
 * Whether the incremental sync engine is driving user-owned models. Kept in its own module,
 * without imports, so hooks can read it without pulling in the engine and its stores.
 *
 * While it is active the delta feed keeps subscriptions, unread counts and read state fresh,
 * so the legacy "refetch when things look wrong" heuristics stand down. They stay in place
 * as the fallback for servers that do not expose the sync endpoints yet.
 */
let active = false

export const isSyncEngineActive = () => active

export const setSyncEngineActive = (next: boolean) => {
  active = next
}

/**
 * The parts of the sync engine that hooks and services need. They are reached through this
 * module for the same reason: no imports, so nothing ends up in an import cycle.
 */
export interface SyncEngineHandle {
  ensureSynced: () => Promise<boolean>
  catchUp: (delayMs?: number) => Promise<boolean>
  requestUnreadCalibration: () => Promise<void>
  /** A full unread snapshot was taken; the counters logged up to this id are inside it. */
  recordUnreadSnapshot: (lastSyncId: number) => Promise<void>
}

let engine: SyncEngineHandle | null = null

export const registerSyncEngine = (next: SyncEngineHandle | null) => {
  engine = next
}

/**
 * Bring the stores up to date through the delta feed. Resolves to `false` when that is not
 * possible, in which case the caller falls back to its full request.
 */
export const ensureSyncedThroughEngine = () => engine?.ensureSynced() ?? Promise.resolve(false)

/** Pick up a change the server made outside the transaction queue. `false`: use a full request. */
export const catchUpThroughEngine = (delayMs?: number) =>
  engine?.catchUp(delayMs) ?? Promise.resolve(false)

export const requestUnreadCalibration = () =>
  engine?.requestUnreadCalibration() ?? Promise.resolve()

export const recordUnreadSnapshotThroughEngine = (lastSyncId: number) =>
  engine?.recordUnreadSnapshot(lastSyncId) ?? Promise.resolve()
