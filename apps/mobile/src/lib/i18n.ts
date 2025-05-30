import dayjs from "dayjs"
import { getLocales } from "expo-localization"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import {
  currentSupportedLanguages,
  dayjsLocaleImportMap,
  defaultNS,
  ns,
} from "@/src/@types/constants"
import { defaultResources } from "@/src/@types/default-resource"

import { getGeneralSettings } from "../atoms/settings/general"

const fallbackLanguage = "en"

export const updateDayjsLocale = async (lang: string) => {
  if (!(lang in dayjsLocaleImportMap)) return
  const dayjsImport = dayjsLocaleImportMap[lang as keyof typeof dayjsLocaleImportMap]
  const [locale, loader] = dayjsImport
  await loader()
  dayjs.locale(locale)
}

export async function initializeI18n() {
  const { language } = getGeneralSettings()

  return Promise.all([
    updateDayjsLocale(language),
    i18n.use(initReactI18next).init({
      ns,
      defaultNS,
      resources: defaultResources,

      lng: language,
      fallbackLng: {
        default: [fallbackLanguage],
        "zh-TW": ["zh-CN", fallbackLanguage],
      },

      interpolation: {
        escapeValue: false,
      },
    }),
  ])
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
