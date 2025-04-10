import { parseHtml } from "@follow/components/src/ui/markdown/parse-html"
import type { SupportedActionLanguage } from "@follow/shared"
import { ACTION_LANGUAGE_MAP } from "@follow/shared"
import { franc } from "franc-min"

function duplicateIfLengthLessThan(text: string, length: number) {
  return text.length < length ? text.repeat(Math.ceil(length / text.length)) : text
}

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
