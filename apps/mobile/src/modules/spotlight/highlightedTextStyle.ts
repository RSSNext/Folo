import { getSpotlightTextColor } from "@follow/shared/spotlight"
import type { TextStyle } from "react-native"

const mobileSpotlightHighlightOpacityHex = "CC"

export const getHighlightedTextSegmentStyle = (color: string): TextStyle => {
  // The theme's light text in dark mode is barely readable on the pale highlight colors
  const textColor = getSpotlightTextColor(color)

  return {
    backgroundColor: `${color}${mobileSpotlightHighlightOpacityHex}`,
    borderRadius: 5,
    paddingHorizontal: 2,
    ...(textColor && { color: textColor }),
  }
}
