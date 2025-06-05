import { unreadCountAllSelector, unreadCountIdSelector } from "./selectors"
import { useUnreadStore } from "./store"

export const getUnreadCount = (id: string) => {
  const state = useUnreadStore.getState()
  return unreadCountIdSelector(id)(state)
}

export const getAllUnreadCount = () => {
  const state = useUnreadStore.getState()
  return unreadCountAllSelector(state)
}
