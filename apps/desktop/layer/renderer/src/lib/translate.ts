import { parseHtml } from "@follow/components/ui/markdown/parse-html.js"
import type { SupportedActionLanguage } from "@follow/shared"
import { ACTION_LANGUAGE_MAP } from "@follow/shared"
import { duplicateIfLengthLessThan } from "@follow/utils/utils"
import { franc } from "franc-min"

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
