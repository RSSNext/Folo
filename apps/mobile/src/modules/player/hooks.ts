import { useImageColors } from "@follow/store/image/hooks"
import { getLuminance, shadeColor } from "@follow/utils"
import { useMemo } from "react"

const defaultBackgroundColor = "#000000"

export function useCoverGradient(url?: string) {
  const imageColors = useImageColors(url)

  const backgroundColor = useMemo(() => {
    if (imageColors?.platform === "ios") {
      return imageColors.background
    } else if (imageColors?.platform === "android") {
      return imageColors.average
    }
    return defaultBackgroundColor
  }, [imageColors])

  const gradientColors = useMemo(() => {
    const shadedColor = shadeColor(backgroundColor, -51)
    return [shadedColor, shadedColor] as const
  }, [backgroundColor])

  const isGradientLight = useMemo(() => {
    return getLuminance(gradientColors[0]) > 0.5
  }, [gradientColors])

  return { isGradientLight, gradientColors }
}
