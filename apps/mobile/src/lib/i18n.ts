import { getLocales } from "expo-localization"

import { currentSupportedLanguages } from "@/src/@types/constants"

export function getDeviceLanguage() {
  const locale = getLocales()[0]
  if (!locale) {
    return "en"
  }

  const { languageCode, languageRegionCode } = locale
  const possibleDeviceLanguage = [
    languageCode,
    languageRegionCode,
    languageCode && languageRegionCode ? `${languageCode}-${languageRegionCode}` : null,
  ].filter((i) => i !== null)

  return possibleDeviceLanguage.find((lang) => currentSupportedLanguages.includes(lang)) || "en"
}
