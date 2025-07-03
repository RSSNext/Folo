import type { SupportedLanguages } from "@follow/models/types"
import type { SupportedActionLanguage } from "@follow/shared"
import { useQueries } from "@tanstack/react-query"
import { useCallback } from "react"

import { useEntryList } from "../entry/hooks"
import type { EntryModel } from "../entry/types"
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
  const entryList = (useEntryList(entryIds)?.filter(
    (entry) => entry !== null && (translation || !!entry?.settings?.translation),
  ) || []) as EntryModel[]

  return useQueries({
    queries: entryList.map((entry) => {
      const entryId = entry.id
      const targetContent =
        target === "readabilityContent" ? entry.readabilityContent : entry.content
      const finalWithContent = withContent && !!targetContent

      return {
        queryKey: ["translation", entryId, language, finalWithContent, target],
        queryFn: () =>
          translationSyncService.generateTranslation({
            entryId,
            language,
            withContent: finalWithContent,
            target,
            checkLanguage,
          }),
      }
    }),
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
