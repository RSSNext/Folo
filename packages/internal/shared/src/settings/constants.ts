import type { AccentColor } from "./interface"

const ACCENT_COLOR_MAP: Record<AccentColor, { light: string; dark: string }> = {
  orange: {
    light: "#FF6B35",
    dark: "#FF5C00",
  },
  blue: {
    light: "#0066FF", // Brighter blue while maintaining contrast with white text
    dark: "#3B82F6", // Darker blue for dark theme
  },
  green: {
    light: "#2DB84D", // Brighter green while maintaining contrast with white text
    dark: "#22C55E", // Darker green for dark theme
  },
  purple: {
    light: "#9F52C7", // Brighter purple while maintaining contrast with white text
    dark: "#A855F7", // Darker purple for dark theme
  },
  pink: {
    light: "#E62E85", // Brighter pink while maintaining contrast with white text
    dark: "#EC4899", // Darker pink for dark theme
  },
  red: {
    light: "#DC3526", // Brighter red while maintaining contrast with white text
    dark: "#EF4444", // Darker red for dark theme
  },
  yellow: {
    light: "#E6A700", // Brighter yellow while maintaining contrast with white text
    dark: "#EAB308", // Darker yellow for dark theme
  },
  gray: {
    light: "#757580", // Brighter gray while maintaining contrast with white text
    dark: "#94A3B8", // Darker gray for dark theme
  },
}

export const getAccentColorValue = (color: AccentColor) => {
  return ACCENT_COLOR_MAP[color]
}
