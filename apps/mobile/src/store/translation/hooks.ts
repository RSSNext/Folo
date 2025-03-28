import { useQuery } from "@tanstack/react-query"
import { useCallback } from "react"

import { useGeneralSettingKey } from "@/src/atoms/settings/general"
import type { SupportedLanguages } from "@/src/lib/language"

import { useEntry } from "../entry/hooks"
import { translationSyncService, useTranslationStore } from "./store"

export const usePrefetchEntryTranslation = (entryId: string) => {
  const entry = useEntry(entryId)
  const translation = useGeneralSettingKey("translation") || !!entry?.settings?.translation
  const actionLanguage = useGeneralSettingKey("actionLanguage") as SupportedLanguages
  return useQuery({
    queryKey: ["entry-translation", entryId, actionLanguage],
    queryFn: () => translationSyncService.generateTranslation(entryId, actionLanguage),
    enabled: translation,
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
