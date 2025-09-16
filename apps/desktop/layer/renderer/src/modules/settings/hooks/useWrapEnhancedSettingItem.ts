import { defaultSettings } from "@follow/shared/settings/defaults"
import { useCallback } from "react"

import { enhancedGeneralSettingKeys, useGeneralSettingKey } from "~/atoms/settings/general"
import { enhancedUISettingKeys } from "~/atoms/settings/ui"

export enum WrapEnhancedSettingTab {
  General,
  Appearance,
}

const enhancedSettingMapper: Record<WrapEnhancedSettingTab, Set<keyof any>> = {
  [WrapEnhancedSettingTab.General]: enhancedGeneralSettingKeys,
  [WrapEnhancedSettingTab.Appearance]: enhancedUISettingKeys,
}
const defaultSettingMapper: Record<WrapEnhancedSettingTab, Record<keyof any, any>> = {
  [WrapEnhancedSettingTab.General]: defaultSettings.general,
  [WrapEnhancedSettingTab.Appearance]: defaultSettings.ui,
}
export const useWrapEnhancedSettingItem = <T extends (key: any, options: any) => any>(
  fn: T,
  tab: WrapEnhancedSettingTab,
): T => {
  const enableEnhancedSettings = useGeneralSettingKey("enhancedSettings")
  return useCallback(
    (key: string, options: any) => {
      const enhancedKeys = enhancedSettingMapper[tab]
      const defaults = defaultSettingMapper[tab]

      if (!enhancedKeys || !defaults) {
        return fn(key, options)
      }

      if (enhancedKeys.has(key) && !enableEnhancedSettings) {
        return null
      }

      return fn(key, options)
    },
    [enableEnhancedSettings, fn, tab],
  ) as any as T
}
