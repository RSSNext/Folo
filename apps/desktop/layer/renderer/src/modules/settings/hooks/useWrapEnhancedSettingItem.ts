import { defaultSettings } from "@follow/shared/settings/defaults"
import { enhancedSettingKeys } from "@follow/shared/settings/enhanced"
import { useCallback } from "react"

import { useGeneralSettingKey } from "~/atoms/settings/general"

export enum WrapEnhancedSettingTab {
  General,
  Appearance,
}

const enhancedSettingMapper: Record<WrapEnhancedSettingTab, Set<keyof any>> = {
  [WrapEnhancedSettingTab.General]: enhancedSettingKeys.general,
  [WrapEnhancedSettingTab.Appearance]: enhancedSettingKeys.ui,
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
