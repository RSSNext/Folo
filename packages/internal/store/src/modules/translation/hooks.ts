import type { SupportedActionLanguage } from "@follow/shared"
import type { SupportedLanguages } from "@follow-app/client-sdk"
import { useQueries } from "@tanstack/react-query"
import { useCallback } from "react"

import { useEntry, useEntryList } from "../entry/hooks"
import type { EntryModel } from "../entry/types"
import { translationSyncService, useTranslationStore } from "./store"

export const usePrefetchEntryTranslation = ({
  entryIds,
  withContent,
  target = "content",
  enabled,
  language,
}: {
  entryIds: string[]
  withContent?: boolean
  target?: "content" | "readabilityContent"
  enabled: boolean
  language: SupportedActionLanguage
}) => {
  const entryList = (useEntryList(entryIds)?.filter(
    (entry) => entry !== null && (enabled || !!entry?.settings?.translation),
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
          }),
      }
    }),
  })
}

export const useEntryTranslation = ({
  entryId,
  language,
  enabled,
}: {
  entryId: string
  language: SupportedLanguages
  enabled: boolean
}) => {
  const actionSetting = useEntry(entryId, (state) => state.settings?.translation)

  return useTranslationStore(
    useCallback(
      (state) => {
        if (!enabled && !actionSetting) return
        return state.data[entryId]?.[language]
      },
      [actionSetting, entryId, language, enabled],
    ),
  )
}
