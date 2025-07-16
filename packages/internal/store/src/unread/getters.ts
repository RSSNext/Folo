import { getListFeedIds } from "../list/getters"
import { unreadCountAllSelector, unreadCountIdSelector, unreadCountIdsSelector } from "./selectors"
import { useUnreadStore } from "./store"
import type { FeedIdOrInboxHandle } from "./types"

export const getUnreadById = (id: FeedIdOrInboxHandle) => {
  const state = useUnreadStore.getState()
  return unreadCountIdSelector(id)(state)
}

export const getUnreadByListId = (listId: string) => {
  const state = useUnreadStore.getState()
  const feedIds = getListFeedIds(listId)
  if (!feedIds) return 0
  return unreadCountIdsSelector(feedIds)(state)
}

export const getUnreadAll = () => {
  const state = useUnreadStore.getState()
  return unreadCountAllSelector(state)
}
