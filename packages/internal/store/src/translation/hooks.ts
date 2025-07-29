import type { SupportedLanguages } from "@follow/models/types"
import type { SupportedActionLanguage } from "@follow/shared"
import { useQueries } from "@tanstack/react-query"
import { useCallback } from "react"

import { useEntry, useEntryList } from "../entry/hooks"
import type { EntryModel } from "../entry/types"
import { translationSyncService, useTranslationStore } from "./store"

export const usePrefetchEntryTranslation = ({
  entryIds,
  withContent,
  target = "content",
  setting,
  language,
  checkLanguage,
}: {
  entryIds: string[]
  withContent?: boolean
  target?: "content" | "readabilityContent"
  setting: boolean
  language: SupportedActionLanguage
  checkLanguage: (params: { content: string; language: SupportedActionLanguage }) => boolean
}) => {
  const entryList = (useEntryList(entryIds)?.filter(
    (entry) => entry !== null && (setting || !!entry?.settings?.translation),
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

export const useEntryTranslation = ({
  entryId,
  language,
  setting,
}: {
  entryId: string
  language: SupportedLanguages
  setting: boolean
}) => {
  const actionSetting = useEntry(entryId, (state) => state.settings?.translation)

  return useTranslationStore(
    useCallback(
      (state) => {
        if (!setting && !actionSetting) return
        return state.data[entryId]?.[language]
      },
      [actionSetting, entryId, language, setting],
    ),
  )
}
