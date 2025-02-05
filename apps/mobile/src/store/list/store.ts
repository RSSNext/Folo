import type { ListSchema } from "@/src/database/schemas/types"
import { apiClient } from "@/src/lib/api-fetch"
import { honoMorph } from "@/src/morph/hono"
import { storeDbMorph } from "@/src/morph/store-db"
import { ListService } from "@/src/services/list"

import { feedActions } from "../feed/store"
import { createImmerSetter, createTransaction, createZustandStore } from "../internal/helper"
import { getList } from "./getters"
import type { CreateListModel } from "./types"

export type ListModel = Omit<ListSchema, "feedIds"> & {
  feedIds: string[]
}
type ListId = string
interface ListState {
  lists: Record<ListId, ListModel>
  listIds: ListId[]
}

const defaultState: ListState = {
  lists: {},
  listIds: [],
}

export const useListStore = createZustandStore<ListState>("list")(() => defaultState)

const get = useListStore.getState
const set = useListStore.setState
const immerSet = createImmerSetter(useListStore)
class ListActions {
  upsertManyInSession(lists: ListModel[]) {
    const state = get()

    set({
      ...state,
      lists: { ...state.lists, ...Object.fromEntries(lists.map((list) => [list.id, list])) },
      listIds: [...state.listIds, ...lists.map((list) => list.id)],
    })
  }
  upsertMany(lists: ListModel[]) {
    const tx = createTransaction()
    tx.store(() => {
      this.upsertManyInSession(lists)
    })

    tx.persist(() => {
      return ListService.upsertMany(lists.map((list) => storeDbMorph.toListSchema(list)))
    })
    tx.run()
  }

  addEntryIdsInSession(params: { listId: string; entryIds: string[] }) {
    const state = get()
    const list = state.lists[params.listId]

    if (!list) return

    set({
      ...state,
      lists: {
        ...state.lists,
        [params.listId]: { ...list, feedIds: [...list.feedIds, ...params.entryIds] },
      },
    })
  }

  async addEntryIds(params: { listId: string; entryIds: string[] }) {
    const tx = createTransaction()
    tx.store(() => {
      this.addEntryIdsInSession(params)
    })

    tx.persist(() => {
      return ListService.addEntryIds(params)
    })
    await tx.run()
  }

  deleteList(params: { listId: string }) {
    const tx = createTransaction()
    tx.store(() => {
      immerSet((draft) => {
        delete draft.lists[params.listId]
        draft.listIds = draft.listIds.filter((id) => id !== params.listId)
      })
    })

    tx.persist(() => {
      return ListService.deleteList(params)
    })

    tx.run()
  }

  reset() {
    set(defaultState)
  }
}

export const listActions = new ListActions()

class ListSyncServices {
  async fetchListById(params: { id: string }) {
    const list = await apiClient.lists.$get({ query: { listId: params.id } })

    listActions.upsertMany([honoMorph.toList(list.data.list)])

    return list.data
  }

  async fetchOwnedLists() {
    const res = await apiClient.lists.list.$get()
    listActions.upsertMany(res.data.map((list) => honoMorph.toList(list)))

    return res.data
  }

  async createList(params: { list: CreateListModel }) {
    const res = await apiClient.lists.$post({
      json: {
        title: params.list.title,
        description: params.list.description,
        image: params.list.image,
        view: params.list.view,
        fee: params.list.fee || 0,
      },
    })
    listActions.upsertMany([honoMorph.toList(res.data)])

    return res.data
  }

  async updateList(params: { listId: string; list: CreateListModel }) {
    const nextModel = {
      title: params.list.title,
      description: params.list.description,
      image: params.list.image,
      view: params.list.view,
      fee: params.list.fee || 0,
      listId: params.listId,
    }
    await apiClient.lists.$patch({
      json: nextModel,
    })

    const list = getList(params.listId)
    if (!list) return

    listActions.upsertMany([
      {
        ...list,
        ...nextModel,
      },
    ])
  }

  async deleteList(params: { listId: string }) {
    await apiClient.lists.$delete({ json: { listId: params.listId } })
    listActions.deleteList({ listId: params.listId })
  }

  async addFeedsToFeedList(params: { listId: string; feedIds: string[] }) {
    const feeds = await apiClient.lists.feeds.$post({
      json: params,
    })
    const list = get().lists[params.listId]
    if (!list) return

    feeds.data.forEach((feed) => {
      feedActions.upsertMany([honoMorph.toFeed(feed)])
    })
    listActions.upsertMany([
      { ...list, feedIds: [...list.feedIds, ...feeds.data.map((feed) => feed.id)] },
    ])
  }
}

export const listSyncServices = new ListSyncServices()
