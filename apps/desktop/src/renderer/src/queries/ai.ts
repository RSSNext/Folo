import type { SupportedLanguages } from "@follow/models/types"

import { apiClient } from "~/lib/api-fetch"
import { defineQuery } from "~/lib/defineQuery"
import { translate } from "~/lib/translate"
import type { FlatEntryModel } from "~/store/entry"

export const ai = {
  translation: ({
    entry,
    view,
    language,
    extraFields,
    part,
    mode,
  }: {
    entry?: FlatEntryModel | null
    view?: number
    language?: SupportedLanguages
    extraFields?: string[]
    part?: string
    mode?: "bilingual" | "translation-only"
  }) =>
    defineQuery(
      [
        "translation",
        entry?.entries.id,
        entry?.entries.content,
        view,
        language,
        extraFields,
        part,
        mode,
      ],
      () => translate({ entry, view, language, extraFields, part, mode }),
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
