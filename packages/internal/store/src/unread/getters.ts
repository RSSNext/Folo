import { unreadCountAllSelector, unreadCountIdSelector } from "./selectors"
import { useUnreadStore } from "./store"

export const getUnreadById = (id: string) => {
  const state = useUnreadStore.getState()
  return unreadCountIdSelector(id)(state)
}

export const getUnreadAll = () => {
  const state = useUnreadStore.getState()
  return unreadCountAllSelector(state)
}
