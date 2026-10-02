import { titleCaseIfEnglish } from "@follow/utils/title-case"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

/**
 * Binds `titleCaseIfEnglish` to the UI language, which decides whenever the text has no
 * language of its own, e.g. settings labels or entries without a `language` field.
 */
export const useTitleCaseIfEnglish = () => {
  const { i18n } = useTranslation()
  const uiLanguage = i18n.language

  return useCallback(
    (text: string, language?: string | null) => titleCaseIfEnglish(text, language || uiLanguage),
    [uiLanguage],
  )
}
