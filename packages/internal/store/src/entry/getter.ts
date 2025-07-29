import { useEntryStore } from "./store"

export const getEntry = (id: string) => {
  return useEntryStore.getState().data[id]
}
