import type { SupportedLanguages } from "@follow/models/types"
import type { SupportedActionLanguage } from "@follow/shared"
import { useQueries } from "@tanstack/react-query"
import { useCallback } from "react"

import { useEntryList } from "../entry/hooks"
import { translationSyncService, useTranslationStore } from "./store"

export const usePrefetchEntryTranslation = ({
  entryIds,
  withContent,
  target = "content",
  translation,
  language,
  checkLanguage,
}: {
  entryIds: string[]
  withContent?: boolean
  target?: "content" | "readabilityContent"
  translation: boolean
  language: SupportedActionLanguage
  checkLanguage: (params: { content: string; language: SupportedActionLanguage }) => boolean
}) => {
  const entryList =
    useEntryList(entryIds)
      ?.filter((entry) => entry !== null && (translation || !!entry?.settings?.translation))
      .map((entry) => entry!.id) || []

  return useQueries({
    queries: entryList.map((entryId) => ({
      queryKey: ["translation", entryId, language, withContent, target],
      queryFn: () =>
        translationSyncService.generateTranslation({
          entryId,
          language,
          withContent,
          target,
          checkLanguage,
        }),
    })),
  })
}

export const useEntryTranslation = (entryId: string, language: SupportedLanguages) => {
  return useTranslationStore(
    useCallback(
      (state) => {
        return state.data[entryId]?.[language]
      },
      [entryId, language],
    ),
  )
}
