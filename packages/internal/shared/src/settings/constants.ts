import type { AccentColor } from "./interface"

export const getAccentColorValue = (color: AccentColor) => {
  switch (color) {
    case "blue": {
      return "#007AFF"
    }
    case "green": {
      return "#4CD964"
    }
    case "purple": {
      return "#9B36B7"
    }
    case "pink": {
      return "#FF2D55"
    }
    case "red": {
      return "#FF3B30"
    }
    case "yellow": {
      return "#FFCC00"
    }
    case "gray": {
      return "#8E8E93"
    }
    default: {
      return "#FF5C00" // orange
    }
  }
}
