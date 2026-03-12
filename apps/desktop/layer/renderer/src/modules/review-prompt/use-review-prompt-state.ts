import type { ReviewPromptState } from "@follow/shared/review-prompt"
import { normalizeReviewPromptState } from "@follow/shared/review-prompt"
import { useWhoami } from "@follow/store/user/hooks"
import { useCallback, useEffect, useMemo, useState } from "react"

import type { DesktopReviewDistribution } from "./utils"
import {
  getDesktopReviewDistribution,
  getDesktopReviewPlatform,
  getDesktopReviewRateTarget,
  getDesktopReviewStorageKey,
  readDesktopReviewPromptState,
  writeDesktopReviewPromptState,
} from "./utils"

export const useDesktopReviewPromptState = () => {
  const user = useWhoami()
  const distribution = getDesktopReviewDistribution()
  const platform = getDesktopReviewPlatform()
  const rateTarget = getDesktopReviewRateTarget()

  const storageKey = useMemo(() => {
    if (!user?.id) {
      return null
    }

    return getDesktopReviewStorageKey(user.id, distribution)
  }, [distribution, user?.id])

  const [reviewState, setReviewState] = useState(() => readDesktopReviewPromptState(storageKey))

  useEffect(() => {
    setReviewState(readDesktopReviewPromptState(storageKey))
  }, [storageKey])

  const getLatestReviewState = useCallback(
    () => readDesktopReviewPromptState(storageKey),
    [storageKey],
  )

  const updateReviewState = useCallback(
    (updater: (state: ReviewPromptState) => ReviewPromptState) => {
      const nextState = normalizeReviewPromptState(updater(getLatestReviewState()))
      writeDesktopReviewPromptState(storageKey, nextState)
      setReviewState(nextState)
      return nextState
    },
    [getLatestReviewState, storageKey],
  )

  return {
    distribution: distribution as DesktopReviewDistribution,
    getLatestReviewState,
    platform,
    rateTarget,
    reviewState,
    storageKey,
    updateReviewState,
    userId: user?.id ?? null,
  }
}
