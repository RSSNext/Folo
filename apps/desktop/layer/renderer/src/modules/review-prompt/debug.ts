let triggerReviewPromptDebug: (() => void) | null = null
let resetReviewPromptDebug: (() => void) | null = null

export const setDesktopReviewPromptDebugAction = (callback: (() => void) | null) => {
  triggerReviewPromptDebug = callback
}

export const openDesktopReviewPromptDebug = () => {
  triggerReviewPromptDebug?.()
}

export const setDesktopReviewPromptResetAction = (callback: (() => void) | null) => {
  resetReviewPromptDebug = callback
}

export const resetDesktopReviewPromptDebug = () => {
  resetReviewPromptDebug?.()
}
