import { useMemo } from "react"

import { useShowAITranslation, useShowAITranslationAuto } from "~/atoms/ai-translation"
import { useActionLanguage } from "~/atoms/settings/general"
import { useAuthQuery } from "~/hooks/common/useBizQuery"
import { Queries } from "~/queries"

import { useEntry } from "../entry"

export function useEntryTranslation({
  entryId,
  extraFields,
}: {
  entryId?: string
  extraFields?: string[]
}) {
  const entry = useEntry(entryId, (state) => ({
    view: state.view,
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
