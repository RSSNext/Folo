import { defaultUISettings } from "@follow/shared/settings/defaults"
import type { UISettings } from "@follow/shared/settings/interface"

import { getDeviceLanguage } from "@/src/lib/i18n"

import { createSettingAtom } from "./internal/helper"

export const createDefaultSettings = (): UISettings => ({
  ...defaultUISettings,
  discoverLanguage: getDeviceLanguage().startsWith("zh") ? "all" : "eng",
})

export const {
  useSettingKey: useUISettingKey,
  useSettingSelector: useUISettingSelector,
  useSettingKeys: useUISettingKeys,
  setSetting: setUISetting,
  clearSettings: clearUISettings,
  initializeDefaultSettings: initializeDefaultUISettings,
  getSettings: getUISettings,
  useSettingValue: useUISettingValue,
  settingAtom: __uiSettingAtom,
} = createSettingAtom("ui", createDefaultSettings)

export const uiServerSyncWhiteListKeys: (keyof UISettings)[] = [
  "uiFontFamily",
  "readerFontFamily",
  "opaqueSidebar",
  // "customCSS",
]
