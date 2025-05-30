import { useMemo } from "react"

import { useUISettingKey } from "~/atoms/settings/ui"

export function useRenderStyle({
  baseFontSize = 16,
  baseLineHeight = 1.75,
}: { baseFontSize?: number; baseLineHeight?: number } = {}) {
  const contentLineHeight = useUISettingKey("contentLineHeight")
  const contentFontSize = useUISettingKey("contentFontSize")
  const readerFontFamily = useUISettingKey("readerFontFamily")

  return useMemo(() => {
    const css = {} as React.CSSProperties
    if (readerFontFamily) {
      css.fontFamily = readerFontFamily
    }
    if (contentLineHeight) {
      css.lineHeight = contentLineHeight * (baseLineHeight / 1.5)
    }
    if (contentFontSize) {
      css.fontSize = contentFontSize * (baseFontSize / 16)
    }

    return css
  }, [readerFontFamily, contentLineHeight, contentFontSize, baseFontSize, baseLineHeight])
}
