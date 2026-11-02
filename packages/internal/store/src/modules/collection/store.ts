import type { FeedViewType } from "@follow/constants"
import type { CollectionSchema } from "@follow/database/schemas/types"
import { CollectionService } from "@follow/database/services/collection"

import { api } from "../../context"
import type { Hydratable, Resetable } from "../../lib/base"
import { createTransaction, createZustandStore } from "../../lib/helper"
import { collectionOverlayKey, isCollectionOverlayKey } from "../../sync/overlay-keys"
import { defineTransactionKind, transactionQueue } from "../../sync/transaction-queue"
import { getEntry } from "../entry/getter"
import { invalidateEntriesQuery } from "../entry/hooks"

interface CollectionState {
  collections: Record<string, CollectionSchema>
}

const defaultState = {
  collections: {},
}

export const useCollectionStore = createZustandStore<CollectionState>("collection")(
  () => defaultState,
)

const get = useCollectionStore.getState
const set = useCollectionStore.setState

// ---------------------------------------------------------------------------
// Transaction kinds
// ---------------------------------------------------------------------------

interface UnstarPayload {
  entryId: string
  /** The collection row before it was removed, restored if the server rejects the change. */
  snapshot: CollectionSchema | null
}

interface SyncedResult {
  lastSyncId?: number
}

export const starEntryTransaction = defineTransactionKind<CollectionSchema, SyncedResult>({
  kind: "collections.star",
  apply(payload) {
    collectionActions.upsertManyInSession([payload])
  },
  rollback(payload) {
    collectionActions.deleteInSession(payload.entryId)
  },
  async execute(payloads) {
    const payload = payloads[0]!
    const res = await api().collections.post({ entryId: payload.entryId, view: payload.view })
    return { lastSyncId: res.lastSyncId }
  },
  syncIdOf: (result) => result.lastSyncId,
  async persist(payloads) {
    await CollectionService.upsertMany(payloads)
  },
  overlays: (payload) => [{ key: collectionOverlayKey(payload.entryId), value: payload }],
})

export const unstarEntryTransaction = defineTransactionKind<UnstarPayload, SyncedResult>({
  kind: "collections.unstar",
  apply(payload) {
    collectionActions.deleteInSession(payload.entryId)
  },
  rollback(payload) {
    if (payload.snapshot) {
      collectionActions.upsertManyInSession([payload.snapshot])
    }
  },
  async execute(payloads) {
    const res = await api().collections.delete({ entryId: payloads[0]!.entryId })
    return { lastSyncId: res.lastSyncId }
  },
  syncIdOf: (result) => result.lastSyncId,
  async persist(payloads) {
    await CollectionService.deleteMany(payloads.map((payload) => payload.entryId))
  },
  overlays: (payload) => [{ key: collectionOverlayKey(payload.entryId), value: null }],
})

// ---------------------------------------------------------------------------
// Sync service
// ---------------------------------------------------------------------------

class CollectionSyncService {
  async starEntry({
    entryId,
    view,
    invalidate,
  }: {
    entryId: string
    view: FeedViewType
    invalidate?: boolean
  }) {
    const entry = getEntry(entryId)
    if (!entry) {
      return
    }

    await transactionQueue.enqueue(starEntryTransaction, {
      createdAt: new Date().toISOString(),
      entryId,
      feedId: entry.feedId,
      view,
    })

    if (invalidate) {
      invalidateEntriesQuery({ collection: true })
    }
  }

  async unstarEntry({ entryId, invalidate = true }: { entryId: string; invalidate?: boolean }) {
    const snapshot = get().collections[entryId] ?? null

    await transactionQueue.enqueue(unstarEntryTransaction, { entryId, snapshot })

    if (invalidate) invalidateEntriesQuery({ collection: true })
  }
}

// ---------------------------------------------------------------------------
// Store actions
// ---------------------------------------------------------------------------

const getPendingCollectionChanges = () => {
  const pendingStars: CollectionSchema[] = []
  const pendingUnstars = new Set<string>()

  for (const [key, value] of transactionQueue.getOverlays()) {
    if (!isCollectionOverlayKey(key)) continue
    if (value) {
      pendingStars.push(value as CollectionSchema)
    } else {
      pendingUnstars.add(key.slice(key.indexOf(":") + 1))
    }
  }

  return { pendingStars, pendingUnstars }
}

class CollectionActions implements Hydratable, Resetable {
  async hydrate() {
    const collections = await CollectionService.getCollectionAll()
    collectionActions.upsertManyInSession(collections)
  }

  upsertManyInSession(collections: CollectionSchema[], options?: { reset?: boolean }) {
    const state = get()
    const nextCollections: CollectionState["collections"] = options?.reset
      ? {}
      : {
          ...state.collections,
        }
    collections.forEach((collection) => {
      if (!collection.entryId) return
      nextCollections[collection.entryId] = collection
    })
    set({
      ...state,
      collections: nextCollections,
    })
  }

  async upsertMany(collections: CollectionSchema[], options?: { reset?: boolean }) {
    const tx = createTransaction()
    tx.store(() => {
      this.upsertManyInSession(collections, options)
    })
    tx.persist(() => {
      return CollectionService.upsertMany(collections, options)
    })
    await tx.run()
  }

  /**
   * Apply a server snapshot of collections while keeping local stars and unstars that the
   * server has not acknowledged yet.
   */
  async reconcileFromRemote({
    collections,
    entryIdsNotInCollections,
    reset,
  }: {
    collections: CollectionSchema[]
    entryIdsNotInCollections: string[]
    reset?: boolean
  }) {
    const { pendingStars, pendingUnstars } = getPendingCollectionChanges()
    const pendingStarIds = new Set(pendingStars.map((collection) => collection.entryId))

    await this.upsertMany(
      collections.filter((collection) => !pendingUnstars.has(collection.entryId)),
      { reset },
    )
    if (reset && pendingStars.length > 0) {
      this.upsertManyInSession(pendingStars)
    }
    await this.delete(entryIdsNotInCollections.filter((entryId) => !pendingStarIds.has(entryId)))
  }

  deleteInSession(entryId: string | string[]) {
    const normalizedEntryId = Array.isArray(entryId) ? entryId : [entryId]

    const state = useCollectionStore.getState()
    const nextCollections: CollectionState["collections"] = {
      ...state.collections,
    }

    normalizedEntryId.forEach((id) => {
      delete nextCollections[id]
    })
    set({
      ...state,
      collections: nextCollections,
    })
  }

  async delete(entryId: string | string[]) {
    const entryIdsInCollection = new Set(Object.keys(get().collections))
    const normalizedEntryId = (Array.isArray(entryId) ? entryId : [entryId]).filter((id) =>
      entryIdsInCollection.has(id),
    )

    if (normalizedEntryId.length === 0) return

    const tx = createTransaction()
    tx.store(() => {
      this.deleteInSession(entryId)
    })
    tx.persist(() => {
      return CollectionService.deleteMany(normalizedEntryId)
    })
    await tx.run()
  }

  async reset() {
    const tx = createTransaction()
    tx.store(() => {
      set(defaultState)
    })

    tx.persist(() => {
      return CollectionService.reset()
    })

    await tx.run()
  }
}

export const collectionActions = new CollectionActions()
export const collectionSyncService = new CollectionSyncService()
