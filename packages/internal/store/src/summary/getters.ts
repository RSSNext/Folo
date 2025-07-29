import type { SupportedActionLanguage } from "@follow/shared/language"

import { useSummaryStore } from "./store"

export const getSummary = (entryId: string, language: SupportedActionLanguage) => {
  return useSummaryStore.getState().data[entryId]?.[language]
}
