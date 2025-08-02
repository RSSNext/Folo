import { createSettingAtom } from "@follow/atoms/helper/setting.js"
import type { SupportedLanguages } from "@follow/models"
import { defaultGeneralSettings } from "@follow/shared/settings/defaults"
import { enhancedGeneralSettingKeys } from "@follow/shared/settings/enhanced"
import type { GeneralSettings } from "@follow/shared/settings/interface"
import { useCallback, useMemo } from "react"

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
export function hookEnhancedSettings<
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
): [T1, T2, T3, T4, T5] {
  const useNextSettingKey = (key: string) => {
    const enableEnhancedSettings = useGeneralSettingKeyInternal("enhancedSettings")
    const settingValue = useSettingKey(key)
    const shouldBackToDefault = enhancedSettingKeys.has(key) && !enableEnhancedSettings
    if (!shouldBackToDefault) {
      return settingValue
    }

    return defaultSettings[key] === undefined ? settingValue : defaultSettings[key]
  }

  const useNextSettingSelector = (selector: (s: any) => any) => {
    const enableEnhancedSettings = useGeneralSettingKeyInternal("enhancedSettings")
    return useSettingSelector(
      useCallback(
        (settings) => {
          if (enableEnhancedSettings) {
            return selector(settings)
          }

          const enhancedSettings = { ...settings }
          for (const key of enhancedSettingKeys) {
            if (defaultSettings[key] !== undefined) {
              enhancedSettings[key] = defaultSettings[key]
            }
          }

          return selector(enhancedSettings)
        },
        [enableEnhancedSettings, selector],
      ),
    )
  }

  const useNextSettingKeys = (keys: string[]) => {
    const enableEnhancedSettings = useGeneralSettingKeyInternal("enhancedSettings")
    const rawSettingValues: string[] = useSettingKeys(keys)

    return useMemo(() => {
      if (enableEnhancedSettings) {
        return rawSettingValues
      }

      const result: string[] = []

      for (const [i, key] of keys.entries()) {
        if (enhancedSettingKeys.has(key) && defaultSettings[key] !== undefined) {
          result.push(defaultSettings[key])
        } else if (rawSettingValues[i] !== undefined) {
          result.push(rawSettingValues[i])
        }
      }

      return result
    }, [enableEnhancedSettings, keys, rawSettingValues])
  }

  const getNextSettings = () => {
    const settings = getSettings()
    const enableEnhancedSettings = jotaiStore.get(__generalSettingAtom).enhancedSettings

    if (enableEnhancedSettings) {
      return settings
    }

    const enhancedSettings = { ...settings }
    for (const key of enhancedSettingKeys) {
      if (defaultSettings[key] !== undefined) {
        enhancedSettings[key] = defaultSettings[key]
      }
    }

    return enhancedSettings
  }

  const useNextSettingValue = () => {
    const settingValues = useSettingValue()
    const enableEnhancedSettings = useGeneralSettingKeyInternal("enhancedSettings")

    return useMemo(() => {
      if (enableEnhancedSettings) {
        return settingValues
      }

      const result = { ...settingValues }
      for (const key of enhancedSettingKeys) {
        if (defaultSettings[key] !== undefined) {
          result[key] = defaultSettings[key]
        }
      }

      return result
    }, [enableEnhancedSettings, settingValues])
  }
  return [
    useNextSettingKey as T1,
    useNextSettingSelector as T2,
    useNextSettingKeys as T3,
    getNextSettings as T4,
    useNextSettingValue as T5,
  ]
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
