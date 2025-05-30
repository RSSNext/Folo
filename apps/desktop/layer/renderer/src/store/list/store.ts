import type { FeedModel, ListModel, ListModelPoplutedFeeds } from "@follow/models/types"
import { sleep } from "@follow/utils/utils"

import { runTransactionInScope } from "~/database"
import { apiClient } from "~/lib/api-fetch"
import { ListService } from "~/services/list"

import { feedActions } from "../feed"
import { createImmerSetter, createTransaction, createZustandStore } from "../utils/helper"
import type { ListState } from "./types"

export const useListStore = createZustandStore<ListState>("list")(() => ({
  lists: {},
}))

const immerSet = createImmerSetter(useListStore)
const get = useListStore.getState
const set = useListStore.setState
class ListActionStatic {
  upsertMany(lists: ListModelPoplutedFeeds[]) {
    if (lists.length === 0) return
    const feeds = [] as FeedModel[]
    set((state) => {
      for (const list of lists) {
        state.lists[list.id] = list

        if (!list.feeds) continue
        for (const feed of list.feeds) {
          feeds.push(feed)
        }
      }

      return {
        ...state,
        lists: { ...state.lists },
      }
    })

    feedActions.upsertMany(feeds)

    runTransactionInScope(() => ListService.upsertMany(lists))
  }

  async fetchOwnedLists() {
    const res = await apiClient.lists.list.$get()
    this.upsertMany(res.data)

    return res.data
  }

  private patch(listId: string, data: Partial<ListModel>) {
    immerSet((state) => {
      state.lists[listId] = { ...state.lists[listId]!, ...data }
      return state
    })

    runTransactionInScope(async () => {
      const patchedData = get().lists[listId]
      if (!patchedData) return
      return ListService.upsert(patchedData as ListModel)
    })
  }
  addFeedToFeedList(listId: string, feed: FeedModel) {
    const list = get().lists[listId]
    if (!list) return
    feedActions.upsertMany([feed])

    this.patch(listId, {
      feedIds: [feed.id, ...list.feedIds],
    })
  }

  removeFeedFromFeedList(listId: string, feedId: string) {
    const list = get().lists[listId] as ListModel
    if (!list) return

    this.patch(listId, {
      feedIds: list.feedIds.filter((id) => id !== feedId),
    })
  }

  async deleteList(listId: string) {
    const deletedList = get().lists[listId]
    if (!deletedList) return
    const tx = createTransaction(deletedList)

    tx.optimistic(async () => {
      immerSet((state) => {
        delete state.lists[listId]
        return state
      })
    })
    tx.execute(async () => {
      await sleep(1000)

      await apiClient.lists.$delete({
        json: {
          listId,
        },
      })
    })
    tx.rollback(async (s) => {
      immerSet((state) => {
        state.lists[listId] = s
        return state
      })
    })

    tx.persist(async () => {
      ListService.bulkDelete([listId])
    })
    await tx.run()
  }

  async fetchListById(id: string, noExtras?: boolean) {
    const res = await apiClient.lists.$get({ query: { listId: id, noExtras } })

    this.upsertMany([res.data.list])
    return res.data
  }

  clear() {
    immerSet((state) => {
      state.lists = {}
    })
  }
}

export const listActions = new ListActionStatic()

export const getListById = (listId: string): Nullable<ListModel> =>
  useListStore.getState().lists[listId]
