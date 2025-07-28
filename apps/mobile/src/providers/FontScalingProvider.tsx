import { vars } from "nativewind"
import type { FC, PropsWithChildren } from "react"
import { useMemo } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import { View } from "react-native"

import { useUISettingKey, useUISettingSelector } from "../atoms/settings/ui"
import { typography } from "../spec/typography"
// https://grok.com/share/bGVnYWN5_0c5669bf-6abb-4f22-bc1a-9cf0a27254c5
const createFontScalingInjectStyles = (scale = 1) => {
  const cssVars = Object.entries(typography).reduce(
    (acc, [key, [fontSize, lineHeight]]) => {
      const kebabKey = key.replaceAll(/([A-Z])/g, "-$1").toLowerCase()
      const nextFontSize = Math.round(fontSize * scale)
      const originalRatio = lineHeight / fontSize
      // Ensure line height is at least 1.2x font size for small fonts, 1.0x for large fonts
      const minRatio = fontSize >= 36 ? 1 : 1.2
      const scaledLineHeight = Math.round(
        Math.max(nextFontSize * Math.max(originalRatio, minRatio), lineHeight * scale),
      )

      acc[`--text-${kebabKey}`] = nextFontSize
      acc[`--text-${kebabKey}-line-height`] = scaledLineHeight
      return acc
    },
    {} as Record<string, number>,
  )

  return vars(cssVars) as StyleProp<ViewStyle>
}
export const FontScalingProvider: FC<PropsWithChildren> = ({ children }) => {
  const fontScale = useUISettingSelector((state) => state.fontScale)
  const systemFontScaling = useUISettingKey("useSystemFontScaling")

  const styles = useMemo(
    () => createFontScalingInjectStyles(systemFontScaling ? 1 : fontScale),
    [fontScale, systemFontScaling],
  )

  return (
    <View className="flex-1" style={styles}>
      {children}
    </View>
  )
}
