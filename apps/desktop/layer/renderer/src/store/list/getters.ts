import { useListStore } from "./store"

export const getListFeedIds = (listId: string) => {
  const list = useListStore.getState().lists[listId]
  return list?.feedIds || []
}
