import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import { defaultNS, ns } from "@/src/@types/constants"
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
