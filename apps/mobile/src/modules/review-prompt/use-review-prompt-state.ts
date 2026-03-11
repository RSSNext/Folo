import type { ReviewPromptState } from "@follow/shared/review-prompt"
import { normalizeReviewPromptState } from "@follow/shared/review-prompt"
import { useWhoami } from "@follow/store/user/hooks"
import { useCallback, useEffect, useMemo, useState } from "react"

import {
  getMobileReviewDistribution,
  getMobileReviewPlatform,
  getMobileReviewRateTarget,
  getMobileReviewStorageKey,
  readMobileReviewPromptState,
  writeMobileReviewPromptState,
} from "./utils"

export const useMobileReviewPromptState = () => {
  const user = useWhoami()
  const distribution = getMobileReviewDistribution()
  const platform = getMobileReviewPlatform()
  const rateTarget = getMobileReviewRateTarget()

  const storageKey = useMemo(() => {
    if (!user?.id) {
      return null
    }

    return getMobileReviewStorageKey(user.id, distribution)
  }, [distribution, user?.id])

  const [reviewState, setReviewState] = useState(() => readMobileReviewPromptState(storageKey))

  useEffect(() => {
    setReviewState(readMobileReviewPromptState(storageKey))
  }, [storageKey])

  const getLatestReviewState = useCallback(
    () => readMobileReviewPromptState(storageKey),
    [storageKey],
  )

  const updateReviewState = useCallback(
    (updater: (state: ReviewPromptState) => ReviewPromptState) => {
      const nextState = normalizeReviewPromptState(updater(getLatestReviewState()))
      writeMobileReviewPromptState(storageKey, nextState)
      setReviewState(nextState)
      return nextState
    },
    [getLatestReviewState, storageKey],
  )

  return {
    distribution,
    getLatestReviewState,
    platform,
    rateTarget,
    reviewState,
    storageKey,
    updateReviewState,
    userId: user?.id ?? null,
  }
}
