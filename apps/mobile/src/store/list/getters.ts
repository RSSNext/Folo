import type { ListModel } from "./store"
import { useListStore } from "./store"

const get = () => useListStore.getState()
export const getList = (id: string) => {
  return get().lists[id] as ListModel | undefined
}
