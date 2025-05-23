import { setFeedUnreadDirty } from "~/atoms/feed"
import { getInboxOrFeedIdFromFeedId } from "~/constants"
import { apiClient } from "~/lib/api-fetch"
import { UnreadService } from "~/services"

import { createImmerSetter, createTransaction, createZustandStore } from "../utils/helper"

interface UnreadState {
  data: Record<string, number>
}
const initialState: UnreadState = {
  data: {},
}
/**
 * feedId or inboxHandle -> unread count
 * Inbox subscription's feedId is `inbox-${inboxId}`, but in this store, we use the inboxId as the key.
 * To get the unread count of a list, you need to get all feed ids in the list first.
 */
export const useUnreadStore = createZustandStore<UnreadState>("unread")(() => initialState)

const set = useUnreadStore.setState
const get = useUnreadStore.getState
const immerSet = createImmerSetter(useUnreadStore)

type UnreadValuesArray = [string, number][]
type UnreadValuesObject = Record<string, number>

class UnreadActions {
  private internal_reset(data?: UnreadValuesObject) {
    const newIds = data ? Object.keys(data) : []
    if (!data || newIds.length === 0) {
      set(initialState)
      UnreadService.clear()
      return
    }

    const idsToDelete = Object.keys(get().data).filter((id) => !(id in data))
    immerSet((state) => {
      state.data = data
    })
    UnreadService.bulkDelete(idsToDelete)
    UnreadService.updateUnread(Object.entries(data))
  }

  clear() {
    this.internal_reset()
  }

  private async internal_setValue(data: UnreadValuesArray) {
    const tx = createTransaction()
    tx.optimistic(() => {
      immerSet((state) => {
        for (const [key, value] of data) {
          state.data[key] = value
        }
      })
    })

    tx.persist(async () => {
      await UnreadService.updateUnread(data)
    })
    await tx.run()
  }

  async fetchUnreadAll() {
    const { data } = await apiClient.reads.$get({
      query: {},
    })
    this.internal_reset(data)
    return data
  }

  /**
   * @returns previous value
   */
  incrementById(id: string, inc: number) {
    const finalId = getInboxOrFeedIdFromFeedId(id)

    const state = get()
    const cur = state.data[finalId]
    const nextValue = Math.max(0, (cur || 0) + inc)

    this.internal_setValue([[finalId, nextValue]])
    setFeedUnreadDirty(finalId)
    return cur
  }

  changeBatch(data: UnreadValuesArray | UnreadValuesObject, type: "increment" | "decrement") {
    const state = get()
    const finalData = (Array.isArray(data) ? data : Object.entries(data)).map(([key, value]) => {
      const finalId = getInboxOrFeedIdFromFeedId(key)
      const cur = state.data[finalId]
      const nextValue = Math.max(0, (cur || 0) + (type === "increment" ? value : -value))
      return [finalId, nextValue] as [string, number]
    })
    this.internal_setValue(finalData)
  }

  updateById(id: string, unread: number) {
    const finalId = getInboxOrFeedIdFromFeedId(id)

    this.internal_setValue([[finalId, unread]])
  }

  upsertMany(data: UnreadValuesObject | UnreadValuesArray) {
    this.internal_setValue(Array.isArray(data) ? data : Object.entries(data))
  }

  subscribeUnreadCount(fn: (count: number) => void, immediately?: boolean) {
    const handler = (state: UnreadState): void => {
      let unread = 0
      for (const key in state.data) {
        unread += state.data[key]!
      }

      fn(unread)
    }
    if (immediately) {
      handler(get())
    }
    return useUnreadStore.subscribe(handler)
  }

  hydrate(
    data: {
      id: string
      count: number
    }[],
  ) {
    immerSet((state) => {
      for (const { id, count } of data) {
        state.data[id] = count
      }
    })
  }
}

export const unreadActions = new UnreadActions()
