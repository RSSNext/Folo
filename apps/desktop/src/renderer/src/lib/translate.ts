import { parseHtml } from "@follow/components/ui/markdown/parse-html.js"
import { views } from "@follow/constants"
import type { SupportedLanguages } from "@follow/models/types"
import { LANGUAGE_MAP } from "@follow/shared"
import { franc } from "franc-min"

import type { FlatEntryModel } from "~/store/entry"

import { apiClient } from "./api-fetch"

export const checkLanguage = ({
  content,
  language,
}: {
  content: string
  language: SupportedLanguages
}) => {
  if (!content) return true
  const pureContent = parseHtml(content)
    .toText()
    .replaceAll(/https?:\/\/\S+|www\.\S+/g, " ")
  const { code } = LANGUAGE_MAP[language]
  if (!code) return false
  const sourceLanguage = franc(pureContent, {
    only: [code],
  })
  if (sourceLanguage === code) {
    return true
  } else {
    return false
  }
}

export async function translate({
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
}) {
  if (!language || !entry) {
    return null
  }
  let fields = language && view !== undefined ? views[view!]!.translation.split(",") : []
  if (extraFields) {
    fields = [...fields, ...extraFields]
  }

  fields = fields.filter((field) => {
    if (language && entry.entries[field]) {
      const isLanguageMatch = checkLanguage({
        content: entry.entries[field],
        language,
      })
      return !isLanguageMatch
    } else {
      return false
    }
  })

  if (fields.length === 0) {
    return null
  }

  const { data } = await apiClient.ai.translation.$get({
    query: {
      id: entry.entries.id,
      language,
      fields: fields?.join(",") || "title",
      part,
    },
  })
  if (!data) {
    return null
  }

  // check if the translation is the same as the original content
  // ignore the whitespace difference
  const isTranslationSame = fields.every((field) => {
    const originalContent = entry.entries[field]
    const translatedContent = data[field]
    return originalContent.replaceAll(/\s/g, "") === translatedContent.replaceAll(/\s/g, "")
  })

  if (isTranslationSame) {
    return null
  }

  return data
}
