import type * as React from "react"

export interface BaseButtonProps {
  isLoading?: boolean
}

// BIZ buttons

export interface ActionButtonProps {
  icon?: React.ReactNode | React.FC<ComponentType>
  tooltip?: React.ReactNode
  tooltipSide?: "top" | "bottom"
  active?: boolean
  disabled?: boolean
  shortcut?: string
  disableTriggerShortcut?: boolean
  enableHoverableContent?: boolean
  size?: "sm" | "md" | "base"

  /**
   * @description only trigger shortcut when focus with in `<Focusable />`
   * @default false
   */
  shortcutOnlyFocusWithIn?: boolean
}
