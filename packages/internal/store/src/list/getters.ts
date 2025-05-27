import { useListStore } from "./store"

const get = () => useListStore.getState()
export const getList = (id: string) => {
  return get().lists[id]
}

export const getListFeedIds = (id: string) => {
  return get().lists[id]?.feedIds
}
