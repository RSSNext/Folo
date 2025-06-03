import type { SupportedLanguages } from "@follow/models/types"

import { apiClient } from "~/lib/api-fetch"
import { defineQuery } from "~/lib/defineQuery"
import { translate } from "~/lib/translate"

export const ai = {
  translation: ({
    entryId,
    view,
    language,
    extraFields,
    part,
  }: {
    entryId?: string | null
    view?: number | null
    language?: SupportedLanguages
    extraFields?: string[]
    part?: string
  }) =>
    defineQuery(["translation", entryId, view, language, extraFields, part], () =>
      translate({ entryId, view, language, extraFields, part }),
    ),
  summary: ({
    entryId,
    language,
    target = "content",
  }: {
    entryId: string
    language?: SupportedLanguages
    target?: "content" | "readabilityContent"
  }) =>
    defineQuery(["summary", entryId, language, target], async () => {
      const res = await apiClient.ai.summary.$get({
        query: {
          id: entryId,
          language,
          target,
        },
      })
      return res.data
    }),
}
