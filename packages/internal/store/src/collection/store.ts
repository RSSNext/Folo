import type { FeedViewType } from "@follow/constants"
import type { CollectionSchema } from "@follow/database/schemas/types"
import { CollectionService } from "@follow/database/services/collection"

import { apiClient } from "../context"
import { getEntry } from "../entry/getter"
import { invalidateEntriesQuery } from "../entry/hooks"
import type { Hydratable, Resetable } from "../internal/base"
import { createTransaction, createZustandStore } from "../internal/helper"

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

class CollectionSyncService {
  async starEntry({ entryId, view }: { entryId: string; view: FeedViewType }) {
    const entry = getEntry(entryId)
    if (!entry) {
      return
    }
    const tx = createTransaction()
    tx.store(async () => {
      await collectionActions.upsertMany([
        {
          createdAt: new Date().toISOString(),
          entryId,
          feedId: entry.feedId,
          view,
        },
      ])
    })
    tx.request(async () => {
      await apiClient().collections.$post({
        json: {
          entryId,
          view,
        },
      })
    })
    tx.rollback(() => {
      collectionActions.delete(entryId)
    })

    await tx.run()

    invalidateEntriesQuery({ collection: true })
  }

  async unstarEntry(entryId: string) {
    const tx = createTransaction()

    const snapshot = useCollectionStore.getState().collections[entryId]
    tx.store(() => {
      collectionActions.delete(entryId)
    })
    tx.request(async () => {
      await apiClient().collections.$delete({
        json: {
          entryId,
        },
      })
    })

    tx.rollback(() => {
      if (!snapshot) return
      collectionActions.upsertMany([snapshot])
    })

    await tx.run()

    invalidateEntriesQuery({ collection: true })
  }
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
    tx.run()
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
