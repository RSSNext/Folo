import { useQueries } from "@tanstack/react-query"
import { useCallback } from "react"

import { useGeneralSettingKey } from "@/src/atoms/settings/general"
import type { SupportedLanguages } from "@/src/lib/language"

import { useEntryList } from "../entry/hooks"
import { translationSyncService, useTranslationStore } from "./store"

export const usePrefetchEntryTranslation = (entryIds: string[], withContent?: boolean) => {
  const translation = useGeneralSettingKey("translation")
  const entryList =
    useEntryList(entryIds)
      ?.filter((entry) => entry !== null && (translation || !!entry?.settings?.translation))
      .map((entry) => entry!.id) || []

  const actionLanguage = useGeneralSettingKey("actionLanguage") as SupportedLanguages

  return useQueries({
    queries: entryList.map((entryId) => ({
      queryKey: ["translation", entryId, actionLanguage, withContent],
      queryFn: () =>
        translationSyncService.generateTranslation({
          entryId,
          language: actionLanguage,
          withContent,
        }),
    })),
  })
}

export const useEntryTranslation = (entryId: string) => {
  const language = useGeneralSettingKey("actionLanguage") as SupportedLanguages
  return useTranslationStore(
    useCallback(
      (state) => {
        return state.data[entryId]?.[language]
      },
      [entryId, language],
    ),
  )
}
