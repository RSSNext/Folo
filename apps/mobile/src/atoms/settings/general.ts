import { defaultGeneralSettings } from "@follow/shared/src/settings/defaults"
import type { GeneralSettings } from "@follow/shared/src/settings/interface"

import { getDeviceLanguage } from "@/src/lib/i18n"
import type { SupportedLanguages } from "@/src/lib/language"

import { createSettingAtom } from "./internal/helper"

const createDefaultSettings = (): GeneralSettings => {
  const deviceLanguage = getDeviceLanguage()
  return {
    ...defaultGeneralSettings,
    language: deviceLanguage,
  }
}

export const {
  useSettingKey: useGeneralSettingKey,
  useSettingSelector: useGeneralSettingSelector,
  useSettingKeys: useGeneralSettingKeys,
  setSetting: setGeneralSetting,
  clearSettings: clearGeneralSettings,
  initializeDefaultSettings: initializeDefaultGeneralSettings,
  getSettings: getGeneralSettings,
  useSettingValue: useGeneralSettingValue,

  settingAtom: __generalSettingAtom,
} = createSettingAtom("general", createDefaultSettings)

export const generalServerSyncWhiteListKeys: (keyof GeneralSettings)[] = [
  "sendAnonymousData",
  "language",
  "appLaunchOnStartup",
  "dataPersist",
  "voice",
]

export function useActionLanguage() {
  const actionLanguage = useGeneralSettingSelector((s) => s.actionLanguage)
  const language = useGeneralSettingSelector((s) => s.language)
  return (actionLanguage === "default" ? language : actionLanguage) as SupportedLanguages
}

export function getActionLanguage() {
  const { actionLanguage, language } = getGeneralSettings()
  return (actionLanguage === "default" ? language : actionLanguage) as SupportedLanguages
}
