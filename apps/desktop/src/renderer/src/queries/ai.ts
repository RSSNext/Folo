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
  }: {
    entry?: FlatEntryModel | null
    view?: number
    language?: SupportedLanguages
    extraFields?: string[]
    part?: string
  }) =>
    defineQuery(["translation", entry, view, language, extraFields, part], () =>
      translate({ entry, view, language, extraFields, part }),
    ),
  summary: ({ entryId, language }: { entryId: string; language?: SupportedLanguages }) =>
    defineQuery(["summary", entryId, language], async () => {
      const res = await apiClient.ai.summary.$get({
        query: {
          id: entryId,
          language,
        },
      })
      return res.data
    }),
}
