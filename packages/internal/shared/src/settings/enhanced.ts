import type { GeneralSettings, UISettings } from "./interface"

export const enhancedGeneralSettingKeys = new Set<keyof GeneralSettings>([
  "groupByDate",
  "autoExpandLongSocialMedia",
])
export const enhancedUISettingKeys = new Set<keyof UISettings>([
  "hideExtraBadge",
  "codeHighlightThemeLight",
  "codeHighlightThemeDark",
  "dateFormat",
  "readerRenderInlineStyle",
  "modalOverlay",
  "reduceMotion",
  "usePointerCursor",
  "opaqueSidebar",
])

export const enhancedSettingKeys = {
  general: enhancedGeneralSettingKeys,
  ui: enhancedUISettingKeys,
}
