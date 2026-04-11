import type { TextStyle } from "react-native"

const mobileSpotlightHighlightOpacityHex = "CC"

export const getHighlightedTextSegmentStyle = (color: string): TextStyle => ({
  backgroundColor: `${color}${mobileSpotlightHighlightOpacityHex}`,
  borderRadius: 5,
  paddingHorizontal: 2,
})
