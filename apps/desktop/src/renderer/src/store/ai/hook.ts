import { useMemo } from "react"

import { useShowAITranslation, useShowAITranslationAuto } from "~/atoms/ai-translation"
import { useActionLanguage } from "~/atoms/settings/general"
import { useAuthQuery } from "~/hooks/common/useBizQuery"
import { Queries } from "~/queries"

import type { FlatEntryModel } from "../entry/types"

export function useEntryTranslation({
  entry,
  extraFields,
}: {
  entry: FlatEntryModel | null
  extraFields?: string[]
}) {
  const actionLanguage = useActionLanguage()
  const showAITranslationFinal = useShowAITranslation(entry)
  const showAITranslationAuto = useShowAITranslationAuto(entry)
  const showAITranslation =
    !extraFields || extraFields.length === 0 ? showAITranslationAuto : showAITranslationFinal

  const res = useAuthQuery(
    Queries.ai.translation({
      entry,
      view: entry?.view,
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
