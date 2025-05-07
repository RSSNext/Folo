import { defaultSettings } from "@follow/shared/settings/defaults"

import { getGeneralSettings, setGeneralSetting } from "~/atoms/settings/general"
import { getUISettings } from "~/atoms/settings/ui"

import { defineMigration } from "../helper"

export const v1 = defineMigration({
  version: "v1",
  migrate: () => {
    const settings = getGeneralSettings()
    const uiSettings = getUISettings()

    let enabledEnhancedSettings = false
    for (const key in defaultSettings.ui) {
      const defaultValue = defaultSettings.ui[key]
      const currentValue = uiSettings[key]
      if (defaultValue !== currentValue) {
        enabledEnhancedSettings = true
        break
      }
    }
    for (const key in defaultSettings.general) {
      const defaultValue = defaultSettings.general[key]
      const currentValue = settings[key]
      if (defaultValue !== currentValue) {
        enabledEnhancedSettings = true
        break
      }
    }
    setGeneralSetting("enhancedSettings", enabledEnhancedSettings)
  },
})
