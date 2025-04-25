import { parseHtml } from "@follow/components/ui/markdown/parse-html.js"
import { views } from "@follow/constants"
import type { SupportedActionLanguage } from "@follow/shared"
import { ACTION_LANGUAGE_MAP } from "@follow/shared"
import { duplicateIfLengthLessThan } from "@follow/utils/utils"
import { franc } from "franc-min"

import { getReadabilityContent } from "~/atoms/readability"
import type { FlatEntryModel } from "~/store/entry"

import { apiClient } from "./api-fetch"

export const checkLanguage = ({
  content,
  language,
}: {
  content: string
  language: SupportedActionLanguage
}) => {
  if (!content) return true
  const pureContent = parseHtml(content)
    .toText()
    .replaceAll(/https?:\/\/\S+|www\.\S+/g, " ")
  const { code } = ACTION_LANGUAGE_MAP[language]
  if (!code) {
    return false
  }

  const sourceLanguage = franc(duplicateIfLengthLessThan(pureContent, 20), {
    only: [code],
  })

  return sourceLanguage === code
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
  language?: SupportedActionLanguage
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

  const readabilityContent = getReadabilityContent()[entry.entries.id]?.content
  fields = fields.filter((field) => {
    if (language && field === "readabilityContent") {
      if (!readabilityContent) return false
      const isLanguageMatch = checkLanguage({
        content: readabilityContent,
        language,
      })
      return !isLanguageMatch
    }

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

  const res = await apiClient.ai.translation.$get({
    query: {
      id: entry.entries.id,
      language,
      fields: fields?.join(",") || "title",
      part,
    },
  })

  const data: {
    description?: string
    title?: string
    content?: string
    readabilityContent?: string
  } = {}

  fields.forEach((field) => {
    const content = field === "readabilityContent" ? readabilityContent : entry.entries[field]
    if (content !== res.data?.[field]) {
      data[field] = res.data?.[field]
    }
  })

  return data
}
