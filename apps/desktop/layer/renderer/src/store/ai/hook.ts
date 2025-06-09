import type { FeedViewType } from "@follow/constants"
import { useEntry } from "@follow/store/entry/hooks"
import { useMemo } from "react"

import { useShowAITranslation, useShowAITranslationAuto } from "~/atoms/ai-translation"
import { useActionLanguage } from "~/atoms/settings/general"
import { useAuthQuery } from "~/hooks/common/useBizQuery"
import { Queries } from "~/queries"

export function useEntryTranslation({
  entryId,
  extraFields,
  view,
}: {
  entryId?: string
  extraFields?: string[]
  view: FeedViewType | undefined
}) {
  const entry = useEntry(entryId, (state) => ({
    translation: state.settings?.translation,
  }))
  const actionLanguage = useActionLanguage()
  const showAITranslationFinal = useShowAITranslation(!!entry?.translation)
  const showAITranslationAuto = useShowAITranslationAuto(!!entry?.translation)
  const showAITranslation =
    !extraFields || extraFields.length === 0 ? showAITranslationAuto : showAITranslationFinal

  const res = useAuthQuery(
    Queries.ai.translation({
      entryId,
      view,
      language: actionLanguage,
      extraFields,
    }),
    {
      enabled: showAITranslation,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      meta: {
        persist: true,
      },
    },
  )

  return useMemo(
    () => ({
      ...res,
      // with persist option enabled, we need to explicitly set data to null when showAITranslation is false
      data: showAITranslation ? res.data : null,
    }),
    [res, showAITranslation],
  )
}
