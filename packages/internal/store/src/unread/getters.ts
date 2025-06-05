import { unreadCountAllSelector, unreadCountIdSelector } from "./selectors"
import { useUnreadStore } from "./store"
import type { FeedIdOrInboxHandle } from "./types"

export const getUnreadById = (id: FeedIdOrInboxHandle) => {
  const state = useUnreadStore.getState()
  return unreadCountIdSelector(id)(state)
}

export const getUnreadAll = () => {
  const state = useUnreadStore.getState()
  return unreadCountAllSelector(state)
}
