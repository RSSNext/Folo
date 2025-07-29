import { isEqual } from "es-toolkit/compat"

import {
  createDefaultGeneralSettings,
  getGeneralSettings,
  setGeneralSetting,
} from "~/atoms/settings/general"
import { createDefaultUISettings, getUISettings } from "~/atoms/settings/ui"

import { defineMigration } from "../helper"

function hasSettingsChanged(
  currentSettings: Record<string, any>,
  defaultSettings: Record<string, any>,
): boolean {
  for (const key in defaultSettings) {
    const defaultValue = defaultSettings[key]
    const currentValue = currentSettings[key]
    if (currentValue === undefined) {
      continue
    }
    if (!isEqual(defaultValue, currentValue)) {
      return true
    }
  }
  return false
}

export const v1 = defineMigration({
  version: "v1",
  migrate: () => {
    const settings = getGeneralSettings()
    const uiSettings = getUISettings()

    const enabledEnhancedSettings =
      hasSettingsChanged(uiSettings, createDefaultUISettings()) ||
      hasSettingsChanged(settings, createDefaultGeneralSettings())

    setGeneralSetting("enhancedSettings", enabledEnhancedSettings)
  },
})
