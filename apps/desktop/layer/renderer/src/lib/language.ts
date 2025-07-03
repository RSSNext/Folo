import LanguageDetector from "i18next-browser-languagedetector"

import { currentSupportedLanguages } from "~/@types/constants"
import { I18N_LOCALE_KEY } from "~/constants"

let defaultLanguage = "en"
const languageDetector = new LanguageDetector(null, {
  order: ["querystring", "localStorage", "navigator"],
  lookupQuerystring: "lng",
  lookupLocalStorage: I18N_LOCALE_KEY,
  caches: ["localStorage"],
})

const userLang = languageDetector.detect()
if (userLang) {
  const firstUserLang = Array.isArray(userLang) ? userLang[0]! : userLang
  const currentLang = currentSupportedLanguages.find((lang) => lang.includes(firstUserLang))
  if (currentLang) {
    defaultLanguage = currentLang
  }
}

export const getDefaultLanguage = () => {
  return defaultLanguage
}
