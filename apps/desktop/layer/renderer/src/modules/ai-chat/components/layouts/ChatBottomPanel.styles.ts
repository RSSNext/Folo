import type { CSSProperties } from "react"

const EMPTY_BOTTOM_PANEL_BASE_OFFSET = "100% + 1rem"

const formatVisualOffsetY = (visualOffsetY: string | number) =>
  typeof visualOffsetY === "number" ? `${visualOffsetY}px` : visualOffsetY

interface BottomPanelContainerStyleOptions {
  centerInputOnEmpty?: boolean
  hasMessages: boolean
  visualOffsetY?: string | number
}

export const getBottomPanelContainerStyle = ({
  centerInputOnEmpty,
  hasMessages,
  visualOffsetY,
}: BottomPanelContainerStyleOptions): CSSProperties | undefined => {
  if (!centerInputOnEmpty || hasMessages) {
    return undefined
  }

  if (visualOffsetY == null) {
    return {
      transform: `translateY(calc(${EMPTY_BOTTOM_PANEL_BASE_OFFSET}))`,
    }
  }

  return {
    transform: `translateY(calc(${EMPTY_BOTTOM_PANEL_BASE_OFFSET} + ${formatVisualOffsetY(visualOffsetY)}))`,
  }
}
