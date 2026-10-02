import i18next from "i18next"

import { resources } from "../@types/resources"

export const defaultNS = "native"

export const i18n = i18next.createInstance() as typeof i18next

i18n.init({
  fallbackLng: {
    default: ["en"],
    "zh-TW": ["zh-CN", "en"],
  },
  defaultNS,
  resources,
  // Strings go to native menus and dialogs, not HTML
  interpolation: {
    escapeValue: false,
  },
})

export const { t } = i18n
