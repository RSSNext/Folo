import { getLocales } from "expo-localization"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import { currentSupportedLanguages, defaultNS, ns } from "@/src/@types/constants"
import { defaultResources } from "@/src/@types/default-resource"

import { getGeneralSettings } from "../atoms/settings/general"

const fallbackLanguage = "en"

export async function initializeI18n() {
  return i18n.use(initReactI18next).init({
    ns,
    defaultNS,
    resources: defaultResources,

    lng: getGeneralSettings().language,
    fallbackLng: fallbackLanguage,

    interpolation: {
      escapeValue: false,
    },
  })
}

export function getDeviceLanguage() {
  const locale = getLocales()[0]
  if (!locale) {
    return fallbackLanguage
  }

  const { languageCode, languageRegionCode } = locale
  const possibleDeviceLanguage = [
    languageCode,
    languageRegionCode,
    languageCode && languageRegionCode ? `${languageCode}-${languageRegionCode}` : null,
  ].filter((i) => i !== null)

  return (
    possibleDeviceLanguage.find((lang) => currentSupportedLanguages.includes(lang)) ||
    fallbackLanguage
  )
}
