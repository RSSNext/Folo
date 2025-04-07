import { useUnreadStore } from "./store"

export const getUnreadCount = (id: string) => {
  const state = useUnreadStore.getState()
  return state.data[id] ?? 0
}

export const getAllUnreadCount = () => {
  const state = useUnreadStore.getState()
  return Object.values(state.data).reduce((acc, unread) => acc + unread, 0)
}
