let triggerReviewPromptDebug: (() => Promise<void>) | null = null
let resetReviewPromptDebug: (() => void) | null = null

export const setMobileReviewPromptDebugAction = (callback: (() => Promise<void>) | null) => {
  triggerReviewPromptDebug = callback
}

export const openMobileReviewPromptDebug = async () => {
  await triggerReviewPromptDebug?.()
}

export const setMobileReviewPromptResetAction = (callback: (() => void) | null) => {
  resetReviewPromptDebug = callback
}

export const resetMobileReviewPromptDebug = () => {
  resetReviewPromptDebug?.()
}
