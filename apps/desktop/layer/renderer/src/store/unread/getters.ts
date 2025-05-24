import { useUnreadStore } from "."

export const getUnreadById = (id: string) => {
  return useUnreadStore.getState().data[id] || 0
}
