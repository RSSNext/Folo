import type { AccentColor } from "./interface"

const ACCENT_COLOR_MAP: Record<AccentColor, { light: string; dark: string }> = {
  orange: {
    light: "#FF6B35",
    dark: "#FF5C00",
  },
  blue: {
    light: "#007AFF",
    dark: "#409CFF",
  },
  green: {
    light: "#34C759",
    dark: "#30E85B",
  },
  purple: {
    light: "#AF52DE",
    dark: "#BF5AF2",
  },
  pink: {
    light: "#FF2D92",
    dark: "#FF69B4",
  },
  red: {
    light: "#FF3B30",
    dark: "#FF6B6B",
  },
  yellow: {
    light: "#FFD54F",
    dark: "#FFD60A",
  },
  gray: {
    light: "#8E8E93",
    dark: "#98989D",
  },
}

export const getAccentColorValue = (color: AccentColor) => {
  return ACCENT_COLOR_MAP[color]
}
