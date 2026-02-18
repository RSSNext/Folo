import type { SupportedActionLanguage } from "@follow/shared"
import type { SupportedLanguages } from "@follow-app/client-sdk"
import { useQueries, useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect } from "react"

import { useEntry, useEntryList } from "../entry/hooks"
import type { EntryModel } from "../entry/types"
import { useIsLoggedIn } from "../user/hooks"
import { translationSyncService, useTranslationStore } from "./store"
import type { TranslationMode } from "./types"

let lastTranslationMode: TranslationMode | null = null

export const usePrefetchEntryTranslation = ({
  entryIds,
  withContent,
  target = "content",
  enabled,
  language,
  mode,
}: {
  entryIds: string[]
  withContent?: boolean
  target?: "content" | "readabilityContent"
  enabled: boolean
  language: SupportedActionLanguage
  mode?: TranslationMode
}) => {
  const translationMode = mode ?? "bilingual"
  const queryClient = useQueryClient()
  const entryList = (useEntryList(entryIds)?.filter(
    (entry) => entry !== null && (enabled || !!entry?.settings?.translation),
  ) || []) as EntryModel[]

  useEffect(() => {
    if (lastTranslationMode === null) {
      lastTranslationMode = translationMode
      return
    }

    if (lastTranslationMode === translationMode) return

    lastTranslationMode = translationMode
    void queryClient.invalidateQueries({
      predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === "translation",
    })
  }, [queryClient, translationMode])

  const isLoggedIn = useIsLoggedIn()
  return useQueries({
    queries: isLoggedIn
      ? entryList.map((entry) => {
          const entryId = entry.id
          const targetContent =
            target === "readabilityContent" ? entry.readabilityContent : entry.content
          const finalWithContent = withContent && !!targetContent

          return {
            queryKey: ["translation", entryId, language, finalWithContent, target, translationMode],
            queryFn: () =>
              translationSyncService.generateTranslation({
                entryId,
                language,
                withContent: finalWithContent,
                target,
                mode: translationMode,
              }),
          }
        })
      : [],
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
