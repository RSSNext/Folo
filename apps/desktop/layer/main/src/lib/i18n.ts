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
})

export const { t } = i18n
