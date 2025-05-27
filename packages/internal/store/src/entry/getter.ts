import { useEntryStore } from "./store"
import type { EntryModel } from "./types"

const get = useEntryStore.getState

export const getEntry = (id: string): EntryModel | undefined => {
  return get().data[id]
}
