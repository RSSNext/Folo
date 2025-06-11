import type { SupportedLanguages } from "@follow/models/types"
import { getEntry } from "@follow/store/entry/getter"

import { apiClient } from "~/lib/api-fetch"
import { defineQuery } from "~/lib/defineQuery"
import { parseHtml } from "~/lib/parse-html"

export const ai = {
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
      const entry = getEntry(entryId)
      const content = target === "readabilityContent" ? entry?.readabilityContent : entry?.content
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
