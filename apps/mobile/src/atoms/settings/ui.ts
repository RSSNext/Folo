import { defaultUISettings } from "@follow/shared/settings/defaults"
import type { UISettings as BaseUISettings } from "@follow/shared/settings/interface"
import type { ReaderTextColorPreset } from "@follow/shared/settings/reader-style"

import { getDeviceLanguage } from "@/src/lib/i18n"

import { createSettingAtom } from "./internal/helper"

export type AppColorScheme = "system" | "light" | "dark"

export interface UISettings extends BaseUISettings {
  /**
   * App-wide color scheme. `system` follows the OS appearance.
   */
  colorScheme: AppColorScheme
  fontScale: number
  useSystemFontScaling: boolean
  useDifferentFontSizeForContent: boolean
  mobileContentFontSize: number
  /**
   * Text color preset applied to the article content in the reading view.
   */
  readerTextColor: ReaderTextColorPreset
  /**
   * Slide the navigation header away while scrolling down in the reading view.
   */
  autoHideReaderHeader: boolean
}
export const createDefaultSettings = (): UISettings => ({
  ...defaultUISettings,
  discoverLanguage: getDeviceLanguage().startsWith("zh") ? "all" : "eng",

  colorScheme: "system",
  fontScale: 1,
  useSystemFontScaling: true,
  useDifferentFontSizeForContent: false,
  mobileContentFontSize: 16,
  readerTextColor: "default",
  autoHideReaderHeader: false,
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

/** Device-local appearance settings: every other appearance setting syncs to the account. */
export const uiLocalOnlyKeys: (keyof UISettings)[] = [
  "uiFontFamily",
  "readerFontFamily",
  "opaqueSidebar",
  "fontScale",
  "useSystemFontScaling",
  // "customCSS",
]
