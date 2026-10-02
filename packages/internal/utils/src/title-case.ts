import { titleCase } from "title-case"

// BCP 47 tags such as `en`, `en-US` or `en_GB`, and the ISO 639-3 code `eng` returned by franc
const ENGLISH_LANGUAGE_REGEXP = /^eng?(?:[-_]|$)/i

/**
 * `title-case` follows English capitalization rules and mangles other languages,
 * e.g. "Pourquoi votre café" becomes "Pourquoi Votre Café", so only apply it to English text.
 */
export const titleCaseIfEnglish = (text: string, language: string | null | undefined) =>
  language && ENGLISH_LANGUAGE_REGEXP.test(language) ? titleCase(text) : text
