/**
 * Constants for entry navigation hints behavior
 */
export const NAVIGATION_HINTS_CONSTANTS = {
  /** Default scroll threshold to trigger scroll hint (px) */
  DEFAULT_SCROLL_THRESHOLD: 100,

  /** Delay before showing first entry hint (ms) */
  FIRST_HINT_DELAY: 500,

  /** Duration to show hints before auto-hiding (ms) */
  HINT_DISPLAY_DURATION: 3000,

  /** Distance from bottom to trigger bottom hint (px) */
  BOTTOM_THRESHOLD: 50,

  /** Distance from bottom to hide bottom hint when scrolling up (px) */
  BOTTOM_HIDE_THRESHOLD: 100,

  /** Throttle interval for scroll handler (ms) */
  SCROLL_THROTTLE_INTERVAL: 100,
} as const

/**
 * Text constants for navigation hints
 */
export const NAVIGATION_HINTS_TEXT = {
  SCROLL_UP_EXIT: "Scroll up or click left-top back button to exit",
  ESC_EXIT: "Press ESC or click left-top back button to exit",
} as const

/**
 * Icon constants for navigation hints
 */
export const NAVIGATION_HINTS_ICONS = {
  ARROW_UP: "i-mgc-up-cute-re",
  ARROW_LEFT_UP: "i-mingcute-arrow-left-up-line",
  ARROW_TO_DOWN: "i-mingcute-arrow-to-down-line",
  CLOSE: "i-mgc-close-cute-re",
} as const
