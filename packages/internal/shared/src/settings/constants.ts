import type { AccentColor } from "./interface"

const ACCENT_COLOR_MAP: Record<string, { light: string; dark: string }> = {
  orange: {
    light: "#FF6B35",
    dark: "#FF5C00",
  },
  blue: {
    light: "#5CA9F2",
    dark: "#2F78E8",
  },
  green: {
    light: "#4CD7A5",
    dark: "#1FA97A",
  },
  purple: {
    light: "#B07BEF",
    dark: "#8A3DCC",
  },
  pink: {
    light: "#F266A8",
    dark: "#C63C82",
  },
  red: {
    light: "#E84A3C",
    dark: "#C22E28",
  },
  yellow: {
    light: "#F7B500",
    dark: "#D99800",
  },
  gray: {
    light: "#8A96A3",
    dark: "#5C6673",
  },
}

export const getAccentColorValue = (color: AccentColor) => {
  // If it's a custom color (hex code), return it for both light and dark
  if (color.startsWith("#")) {
    return { light: color, dark: color }
  }
  return ACCENT_COLOR_MAP[color] || ACCENT_COLOR_MAP.blue
}
