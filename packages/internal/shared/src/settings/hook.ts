import { useCallback, useMemo } from "react"

// Generic enhanced settings hook composer shared across platforms
export function hookEnhancedSettings<
  TUseKey extends (key: any) => any,
  TUseSelector extends (selector: (s: any) => any) => any,
  TUseKeys extends (keys: any) => any,
  TGetSettings extends () => any,
  TUseValue extends () => any,
>(
  useSettingKey: TUseKey,
  useSettingSelector: TUseSelector,
  useSettingKeys: TUseKeys,
  getSettings: TGetSettings,
  useSettingValue: TUseValue,

  enhancedSettingKeys: Set<string>,
  defaultSettings: Record<string, any>,
  options: {
    // Provide whether enhanced settings are enabled (reactive version)
    useEnhancedEnabled: () => boolean
    // Provide whether enhanced settings are enabled (sync read version)
    getEnhancedEnabled: () => boolean
  },
) {
  const { useEnhancedEnabled, getEnhancedEnabled } = options

  const useNextSettingKey = (key: string) => {
    const enableEnhancedSettings = useEnhancedEnabled()
    const settingValue = useSettingKey(key)
    const shouldBackToDefault = enhancedSettingKeys.has(key) && !enableEnhancedSettings
    if (!shouldBackToDefault) {
      return settingValue
    }

    return defaultSettings[key] === undefined ? settingValue : defaultSettings[key]
  }

  const useNextSettingSelector = (selector: (s: any) => any) => {
    const enableEnhancedSettings = useEnhancedEnabled()
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
    const enableEnhancedSettings = useEnhancedEnabled()
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
    const enableEnhancedSettings = getEnhancedEnabled()

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
    const enableEnhancedSettings = useEnhancedEnabled()

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
    useNextSettingKey as TUseKey,
    useNextSettingSelector as TUseSelector,
    useNextSettingKeys as TUseKeys,
    getNextSettings as TGetSettings,
    useNextSettingValue as TUseValue,
  ] as [TUseKey, TUseSelector, TUseKeys, TGetSettings, TUseValue]
}
