import { useListStore } from "./store"

export const getListById = (id: string) => {
  const get = () => useListStore.getState()
  return get().lists[id]
}

export const getListFeedIds = (id: string) => {
  const get = () => useListStore.getState()
  return get().lists[id]?.feedIds
}
