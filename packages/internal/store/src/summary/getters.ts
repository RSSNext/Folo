import { useSummaryStore } from "./store"

export const getSummary = (entryId: string) => {
  return useSummaryStore.getState().data[entryId]
}
