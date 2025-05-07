import type { FeedViewType } from "@follow/constants"

import type { CollectionSchema } from "@/src/database/schemas/types"
import { apiClient } from "@/src/lib/api-fetch"
import { CollectionService } from "@/src/services/collection"

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

// const get = useCollectionStore.getState
const set = useCollectionStore.setState

class CollectionSyncService {
  async starEntry({
    entryId,
    feedId,
    view,
  }: {
    entryId: string
    feedId: string
    view: FeedViewType
  }) {
    const tx = createTransaction()
    tx.store(async () => {
      await collectionActions.upsertMany([
        {
          createdAt: new Date().toISOString(),
          entryId,
          feedId,
          view,
        },
      ])
    })
    tx.request(async () => {
      await apiClient.collections.$post({
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
  }

  async unstarEntry(entryId: string) {
    const tx = createTransaction()

    const snapshot = useCollectionStore.getState().collections[entryId]
    tx.store(() => {
      collectionActions.delete(entryId)
    })
    tx.request(async () => {
      await apiClient.collections.$delete({
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
  }
}

class CollectionActions {
  async upsertManyInSession(collections: CollectionSchema[]) {
    const state = useCollectionStore.getState()
    const nextCollections: CollectionState["collections"] = {
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

  async upsertMany(collections: CollectionSchema[]) {
    const tx = createTransaction()
    tx.store(() => {
      this.upsertManyInSession(collections)
    })
    tx.persist(() => {
      return CollectionService.upsertMany(collections)
    })
    tx.run()
  }

  async deleteInSession(entryId: string) {
    const state = useCollectionStore.getState()
    const nextCollections: CollectionState["collections"] = {
      ...state.collections,
    }
    delete nextCollections[entryId]
    set({
      ...state,
      collections: nextCollections,
    })
  }

  async delete(entryId: string) {
    const tx = createTransaction()
    tx.store(() => {
      this.deleteInSession(entryId)
    })
    tx.persist(() => {
      return CollectionService.delete(entryId)
    })
    tx.run()
  }

  reset() {
    set(defaultState)
  }
}

export const collectionActions = new CollectionActions()
export const collectionSyncService = new CollectionSyncService()
