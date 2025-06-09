import type { SupportedLanguages } from "@follow/models/types"
import { getEntry } from "@follow/store/entry/getter"

import { getReadabilityContent } from "~/atoms/readability"
import { apiClient } from "~/lib/api-fetch"
import { defineQuery } from "~/lib/defineQuery"
import { parseHtml } from "~/lib/parse-html"
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
      const content =
        target === "readabilityContent"
          ? getReadabilityContent()[entryId]?.content
          : getEntry(entryId)?.content
      if (!content) {
        return null
      }

      const text = parseHtml(content).toText()
      if (text.length < 100) {
        return null
      }

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
