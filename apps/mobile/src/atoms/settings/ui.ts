import type { UISettings } from "@/src/interfaces/settings/ui"

import { createSettingAtom } from "./internal/helper"

export const createDefaultSettings = (): UISettings => ({
  // Subscription

  hideExtraBadge: false,

  subscriptionShowUnreadCount: true,
  thumbnailRatio: "square",

  // Content
  readerRenderInlineStyle: false,
  codeHighlightThemeLight: "github-light",
  codeHighlightThemeDark: "github-dark",
  guessCodeLanguage: true,
  hideRecentReader: false,
  customCSS: "",

  // View

  pictureViewFilterNoImage: false,
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
