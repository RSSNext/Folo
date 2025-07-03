import { ListService } from "@follow/database/services/list"
import { clone } from "es-toolkit"

import { apiClient } from "../context"
import { feedActions } from "../feed/store"
import type { Hydratable, Resetable } from "../internal/base"
import { createImmerSetter, createTransaction, createZustandStore } from "../internal/helper"
import { honoMorph } from "../morph/hono"
import { storeDbMorph } from "../morph/store-db"
import { subscriptionActions, subscriptionSyncService } from "../subscription/store"
import type { CreateListModel, ListModel } from "./types"

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
class ListActions implements Hydratable, Resetable {
  async hydrate() {
    const lists = await ListService.getListAll()
    listActions.upsertManyInSession(
      lists.map((list) => ({
        ...list,
        feedIds: JSON.parse(list.feedIds || "[]") as string[],
        type: "list" as const,
      })),
    )
  }

  upsertManyInSession(lists: ListModel[]) {
    const state = get()

    set({
      ...state,
      lists: { ...state.lists, ...Object.fromEntries(lists.map((list) => [list.id, list])) },
      listIds: [...state.listIds, ...lists.map((list) => list.id)],
    })
  }

  async upsertMany(lists: ListModel[]) {
    const tx = createTransaction()
    tx.store(() => {
      this.upsertManyInSession(lists)
    })

    tx.persist(() => {
      return ListService.upsertMany(lists.map((list) => storeDbMorph.toListSchema(list)))
    })
    await tx.run()
  }

  async reset() {
    const tx = createTransaction()
    tx.store(() => {
      set(defaultState)
    })

    tx.persist(() => {
      return ListService.reset()
    })

    await tx.run()
  }
}

export const listActions = new ListActions()

class ListSyncServices {
  async fetchListById(params: { id: string | undefined }) {
    if (!params.id) return null
    const list = await apiClient().lists.$get({ query: { listId: params.id } })

    await listActions.upsertMany([honoMorph.toList(list.data.list)])

    return list.data
  }

  async fetchOwnedLists() {
    const res = await apiClient().lists.list.$get({ query: {} })
    await listActions.upsertMany(res.data.map((list) => honoMorph.toList(list)))

    return res.data.map((list) => honoMorph.toList(list))
  }

  async createList(params: { list: CreateListModel }) {
    const res = await apiClient().lists.$post({
      json: {
        title: params.list.title,
        description: params.list.description,
        image: params.list.image,
        view: params.list.view,
        fee: params.list.fee || 0,
      },
    })
    await listActions.upsertMany([honoMorph.toList(res.data)])
    await subscriptionActions.upsertMany([
      {
        isPrivate: false,
        listId: res.data.id,
        type: "list",
        userId: res.data.ownerUserId || "",
        view: res.data.view,
        createdAt: new Date().toISOString(),
      },
    ])

    return res.data
  }

  async updateList(params: { listId: string; list: CreateListModel }) {
    const tx = createTransaction()
    const snapshot = get().lists[params.listId]
    if (!snapshot) return

    const nextModel = {
      title: params.list.title,
      description: params.list.description,
      image: params.list.image,
      view: params.list.view,
      fee: params.list.fee || 0,
      listId: params.listId,
    }

    tx.store(async () => {
      await listActions.upsertMany([
        {
          ...snapshot,
          ...nextModel,
        },
      ])
    })

    tx.request(async () => {
      await apiClient().lists.$patch({
        json: nextModel,
      })
    })

    tx.persist(async () => {
      if (params.list.view === snapshot.view) return
      await subscriptionSyncService.changeListView({
        listId: params.listId,
        view: params.list.view,
      })
    })

    tx.rollback(async () => {
      await listActions.upsertMany([snapshot])
    })

    await tx.run()
  }

  async deleteList(listId: string) {
    const list = get().lists[listId]
    if (!list) return
    const listToDelete = clone(list)

    const tx = createTransaction()
    tx.store(() => {
      immerSet((draft) => {
        delete draft.lists[listId]
        draft.listIds = draft.listIds.filter((id) => id !== listId)
      })
    })

    tx.request(async () => {
      await subscriptionSyncService.unsubscribe([listId])
      await apiClient().lists.$delete({ json: { listId } })
    })

    tx.rollback(() => {
      immerSet((draft) => {
        draft.lists[listId] = listToDelete
        draft.listIds.push(listId)
      })
    })

    tx.persist(() => {
      return ListService.deleteList(listId)
    })

    await tx.run()
  }

  async addFeedsToFeedList(
    params: { listId: string; feedIds: string[] } | { listId: string; feedId: string },
  ) {
    const feeds = await apiClient().lists.feeds.$post({
      json: params,
    })
    const list = get().lists[params.listId]
    if (!list) return

    feeds.data.forEach((feed) => {
      feedActions.upsertMany([honoMorph.toFeed(feed)])
    })
    await listActions.upsertMany([
      { ...list, feedIds: [...list.feedIds, ...feeds.data.map((feed) => feed.id)] },
    ])
  }

  async removeFeedFromFeedList(params: { listId: string; feedId: string }) {
    await apiClient().lists.feeds.$delete({
      json: params,
    })
    const list = get().lists[params.listId]
    if (!list) return

    const feedIds = list.feedIds.filter((id) => id !== params.feedId)
    await listActions.upsertMany([{ ...list, feedIds }])
  }
}

export const listSyncServices = new ListSyncServices()
