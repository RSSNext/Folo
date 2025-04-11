import { useIsDark } from "@follow/hooks"

import { useUISettingSelector } from "~/atoms/settings/ui"

export const useShikiDefaultTheme = (overrideTheme?: string) => {
  const isDark = useIsDark()
  const codeThemeLight = useUISettingSelector((s) => overrideTheme || s.codeHighlightThemeLight)
  const codeThemeDark = useUISettingSelector((s) => overrideTheme || s.codeHighlightThemeDark)

  return isDark ? codeThemeDark : codeThemeLight
}
