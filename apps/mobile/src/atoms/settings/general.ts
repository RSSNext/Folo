import { defaultGeneralSettings } from "@follow/shared/src/settings/defaults"
import type { GeneralSettings } from "@follow/shared/src/settings/interface"

import { getDeviceLanguage } from "@/src/lib/i18n"

import { createSettingAtom } from "./internal/helper"

const createDefaultSettings = (): GeneralSettings => {
  const deviceLanguage = getDeviceLanguage()
  return {
    ...defaultGeneralSettings,
    actionLanguage: deviceLanguage,
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
