import { useQueries } from "@tanstack/react-query"
import { useCallback } from "react"

import { useGeneralSettingKey } from "@/src/atoms/settings/general"
import type { SupportedLanguages } from "@/src/lib/language"

import { useEntryList } from "../entry/hooks"
import { translationSyncService, useTranslationStore } from "./store"

export const usePrefetchEntryTranslation = ({
  entryIds,
  withContent,
  target = "content",
}: {
  entryIds: string[]
  withContent?: boolean
  target?: "content" | "readabilityContent"
}) => {
  const translation = useGeneralSettingKey("translation")
  const entryList =
    useEntryList(entryIds)
      ?.filter((entry) => entry !== null && (translation || !!entry?.settings?.translation))
      .map((entry) => entry!.id) || []

  const actionLanguage = useGeneralSettingKey("actionLanguage") as SupportedLanguages

  return useQueries({
    queries: entryList.map((entryId) => ({
      queryKey: ["translation", entryId, actionLanguage, withContent, target],
      queryFn: () =>
        translationSyncService.generateTranslation({
          entryId,
          language: actionLanguage,
          withContent,
          target,
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
