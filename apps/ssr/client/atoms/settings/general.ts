import { currentSupportedLanguages } from "@client/@types/constants"
import type { GeneralSettings } from "@follow/shared/settings/interface"
import { getStorageNS } from "@follow/utils/ns"
import LanguageDetector from "i18next-browser-languagedetector"

import { createSettingAtom } from "./helper"

const I18N_LOCALE_KEY = getStorageNS("I18N_LOCALE")

const getDefaultLanguage = (): string => {
  const languageDetector = new LanguageDetector(null, {
    order: ["querystring", "localStorage", "navigator"],
    lookupQuerystring: "lng",
    lookupLocalStorage: I18N_LOCALE_KEY,
    caches: ["localStorage"],
  })
  const userLang = languageDetector.detect()
  if (!userLang) return "en"
  const firstUserLang = Array.isArray(userLang) ? userLang[0]! : userLang
  return currentSupportedLanguages.includes(firstUserLang) ? firstUserLang : "en"
}

const createDefaultSettings = (): Partial<GeneralSettings> => ({
  // App
  appLaunchOnStartup: false,
  language: getDefaultLanguage(),
  // Data control
  dataPersist: true,
  sendAnonymousData: true,

  // view
  unreadOnly: false,
  // mark unread
  scrollMarkUnread: true,
  hoverMarkUnread: true,
  renderMarkUnread: false,
  // UX
  // autoHideFeedColumn: true,
  groupByDate: true,
  // Secure
  jumpOutLinkWarn: true,
  voice: "",
})

export const {
  useSettingKey: useGeneralSettingKey,
  useSettingSelector: useGeneralSettingSelector,
  setSetting: setGeneralSetting,
  clearSettings: clearGeneralSettings,
  initializeDefaultSettings: initializeDefaultGeneralSettings,
  getSettings: getGeneralSettings,
  useSettingValue: useGeneralSettingValue,

  settingAtom: __generalSettingAtom,
} = createSettingAtom("general", createDefaultSettings)

export const generalServerSyncWhiteListKeys: (keyof GeneralSettings)[] = [
  "appLaunchOnStartup",
  "dataPersist",
  "sendAnonymousData",
  "language",
]
