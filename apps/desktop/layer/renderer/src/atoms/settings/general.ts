import { createSettingAtom } from "@follow/atoms/helper/setting.js"
import { defaultGeneralSettings } from "@follow/shared/settings/defaults"
import { hookEnhancedSettings as baseHookEnhancedSettings } from "@follow/shared/settings/hook"
import type { GeneralSettings } from "@follow/shared/settings/interface"
import type { SupportedLanguages } from "@follow-app/client-sdk"

import { jotaiStore } from "~/lib/jotai"
import { getDefaultLanguage } from "~/lib/language"

export const DEFAULT_ACTION_LANGUAGE = "default"

export const createDefaultGeneralSettings = (): GeneralSettings => ({
  ...defaultGeneralSettings,
  language: getDefaultLanguage(),
})

const {
  useSettingKey: useGeneralSettingKeyInternal,
  useSettingSelector: useGeneralSettingSelectorInternal,
  useSettingKeys: useGeneralSettingKeysInternal,
  setSetting: setGeneralSetting,
  clearSettings: clearGeneralSettings,
  initializeDefaultSettings: initializeDefaultGeneralSettings,
  getSettings: getGeneralSettingsInternal,
  useSettingValue: useGeneralSettingValueInternal,

  settingAtom: __generalSettingAtom,
} = createSettingAtom("general", createDefaultGeneralSettings)
export const hookEnhancedSettings = <
  T1 extends (key: any) => any,
  T2 extends (selector: (s: any) => any) => any,
  T3 extends (keys: any) => any,
  T4 extends () => any,
  T5 extends () => any,
>(
  useSettingKey: T1,
  useSettingSelector: T2,
  useSettingKeys: T3,
  getSettings: T4,
  useSettingValue: T5,

  enhancedSettingKeys: Set<string>,
  defaultSettings: Record<string, any>,
): [T1, T2, T3, T4, T5] => {
  return baseHookEnhancedSettings(
    useSettingKey,
    useSettingSelector,
    useSettingKeys,
    getSettings,
    useSettingValue,

    enhancedSettingKeys,
    defaultSettings,
    {
      useEnhancedEnabled: () => useGeneralSettingKeyInternal("enhancedSettings"),
      getEnhancedEnabled: () => jotaiStore.get(__generalSettingAtom).enhancedSettings,
    },
  )
}

export function useActionLanguage() {
  const actionLanguage = useGeneralSettingSelectorInternal((s) => s.actionLanguage)
  const language = useGeneralSettingSelectorInternal((s) => s.language)
  return (
    actionLanguage === DEFAULT_ACTION_LANGUAGE ? language : actionLanguage
  ) as SupportedLanguages
}

export function getActionLanguage() {
  const { actionLanguage, language } = getGeneralSettingsInternal()
  return (
    actionLanguage === DEFAULT_ACTION_LANGUAGE ? language : actionLanguage
  ) as SupportedLanguages
}

export function useHideAllReadSubscriptions() {
  const hideAllReadSubscriptions = useGeneralSettingKey("hideAllReadSubscriptions")
  const unreadOnly = useGeneralSettingKey("unreadOnly")
  return hideAllReadSubscriptions && unreadOnly
}

export const generalServerSyncWhiteListKeys: (keyof GeneralSettings)[] = [
  "appLaunchOnStartup",
  "sendAnonymousData",
  "language",
  "voice",
]

export const enhancedGeneralSettingKeys = new Set<keyof GeneralSettings>([
  "groupByDate",
  "autoExpandLongSocialMedia",
])

const [
  useGeneralSettingKey,
  useGeneralSettingSelector,
  useGeneralSettingKeys,
  getGeneralSettings,
  useGeneralSettingValue,
] = hookEnhancedSettings(
  useGeneralSettingKeyInternal,
  useGeneralSettingSelectorInternal,
  useGeneralSettingKeysInternal,
  getGeneralSettingsInternal,
  useGeneralSettingValueInternal,

  enhancedGeneralSettingKeys,
  defaultGeneralSettings,
)
export {
  __generalSettingAtom,
  clearGeneralSettings,
  getGeneralSettings,
  initializeDefaultGeneralSettings,
  setGeneralSetting,
  useGeneralSettingKey,
  useGeneralSettingKeys,
  useGeneralSettingSelector,
  useGeneralSettingValue,
}
