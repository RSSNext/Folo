import { sheetStackAtom } from "@follow/components/ui/sheet/context.js"
import { UserRole } from "@follow/constants"
import {
  getReviewPromptEligibility,
  recordReviewPromptActiveDay,
  recordReviewPromptEntryOpen,
  recordReviewPromptPaidConversion,
  recordReviewPromptSubscriptionAdded,
  syncReviewPromptSubscriptionCount,
} from "@follow/shared/review-prompt"
import { useAllFeedSubscription, useAllListSubscription } from "@follow/store/subscription/hooks"
import { useUserRole } from "@follow/store/user/hooks"
import { tracker, TrackerMapper, trackManager } from "@follow/tracker"
import { useAtomValue } from "jotai"
import { useEffect, useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router"

import { useIsInMASReview } from "~/atoms/server-configs"
import { useHasModal, useModalStack } from "~/components/ui/modal/stacked/hooks"

import { DebugRegistry } from "../debug/registry"
import { setDesktopReviewPromptDebugAction, setDesktopReviewPromptResetAction } from "./debug"
import { ReviewPromptModalContent } from "./ReviewPromptModalContent"
import { useDesktopReviewPromptState } from "./use-review-prompt-state"
import {
  clearDesktopReviewPromptState,
  getDesktopReviewDebugTarget,
  openDesktopFeedbackEmail,
  openDesktopStoreReview,
  persistDesktopReviewOutcome,
  readDesktopReviewPromptState,
  REVIEW_PROMPT_QUIET_WINDOW_MS,
} from "./utils"

const isPaidRole = (role: ReturnType<typeof useUserRole>) =>
  role === UserRole.Pro || role === UserRole.Plus

export const ReviewPromptProvider = () => {
  const { t } = useTranslation("settings")
  const location = useLocation()
  const { present } = useModalStack()
  const hasModal = useHasModal()
  const sheetStack = useAtomValue(sheetStackAtom)
  const feedSubscriptions = useAllFeedSubscription()
  const listSubscriptions = useAllListSubscription()
  const role = useUserRole()
  const isInMASReview = useIsInMASReview()

  const {
    distribution,
    getLatestReviewState,
    platform,
    rateTarget,
    reviewState,
    storageKey,
    updateReviewState,
    userId,
  } = useDesktopReviewPromptState()

  const hasAttemptedInSessionRef = useRef(false)
  const lastActionRef = useRef<"positive" | "negative" | null>(null)
  const roleRef = useRef(role)
  const subscriptionCountRef = useRef(feedSubscriptions.length + listSubscriptions.length)

  subscriptionCountRef.current = feedSubscriptions.length + listSubscriptions.length

  useEffect(() => {
    hasAttemptedInSessionRef.current = false
  }, [storageKey])

  useEffect(() => {
    if (!userId) {
      return
    }

    const recordActiveDay = () => {
      updateReviewState((state) => recordReviewPromptActiveDay(state, new Date()))
    }

    recordActiveDay()

    const onVisibilityChange = () => {
      if (!document.hidden) {
        recordActiveDay()
      }
    }

    window.addEventListener("focus", recordActiveDay)
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      window.removeEventListener("focus", recordActiveDay)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [updateReviewState, userId])

  useEffect(() => {
    if (!userId) {
      roleRef.current = role
      return
    }

    if (isPaidRole(role) && !isPaidRole(roleRef.current)) {
      updateReviewState((state) => recordReviewPromptPaidConversion(state, new Date()))
    }

    roleRef.current = role
  }, [role, updateReviewState, userId])

  useEffect(() => {
    if (!userId) {
      return
    }

    updateReviewState((state) =>
      syncReviewPromptSubscriptionCount(state, subscriptionCountRef.current),
    )
  }, [feedSubscriptions.length, listSubscriptions.length, updateReviewState, userId])

  useEffect(() => {
    if (!userId) {
      return
    }

    return trackManager.setTrackFn((code) => {
      switch (code) {
        case TrackerMapper.NavigateEntry: {
          updateReviewState((state) => recordReviewPromptEntryOpen(state))
          break
        }
        case TrackerMapper.Subscribe: {
          updateReviewState((state) =>
            recordReviewPromptSubscriptionAdded(state, subscriptionCountRef.current),
          )
          break
        }
      }

      return Promise.resolve()
    })
  }, [updateReviewState, userId])

  const isRouteBlocked = useMemo(
    () => location.pathname.startsWith("/settings/plan"),
    [location.pathname],
  )
  const isInQuietWindow = !hasModal && sheetStack.length === 0 && !isRouteBlocked
  const isPlatformSupported = distribution !== "unsupported" && !isInMASReview
  const presentReviewPrompt = useMemo(
    () =>
      ({
        score,
        source,
        target = rateTarget,
      }: {
        score?: number
        source: "auto" | "manual"
        target?: ReturnType<typeof getDesktopReviewDebugTarget>
      }) => {
        if (!target) {
          return
        }

        lastActionRef.current = null
        tracker.reviewPromptShown({ distribution, platform, score, source })

        present({
          canClose: true,
          clickOutsideToDismiss: true,
          id: "review-prompt-modal",
          onClose: () => {
            if (lastActionRef.current) {
              lastActionRef.current = null
              return
            }

            persistDesktopReviewOutcome({
              appVersion: APP_VERSION,
              distribution,
              outcome: "dismissed",
              platform,
              source,
              state: readDesktopReviewPromptState(storageKey),
              storageKey,
            })
          },
          title: t("reviewPrompt.title"),
          content: ({ dismiss }) => (
            <ReviewPromptModalContent
              dismiss={dismiss}
              onNegative={() => {
                lastActionRef.current = "negative"
                persistDesktopReviewOutcome({
                  appVersion: APP_VERSION,
                  distribution,
                  outcome: "negative_feedback",
                  platform,
                  source,
                  state: readDesktopReviewPromptState(storageKey),
                  storageKey,
                })
                void openDesktopFeedbackEmail({ distribution, userId })
              }}
              onPositive={() => {
                lastActionRef.current = "positive"
                persistDesktopReviewOutcome({
                  appVersion: APP_VERSION,
                  distribution,
                  outcome: "positive_store_redirect",
                  platform,
                  score,
                  source,
                  state: readDesktopReviewPromptState(storageKey),
                  storageKey,
                })
                void openDesktopStoreReview(target)
              }}
            />
          ),
        })
      },
    [distribution, platform, present, rateTarget, storageKey, t, userId],
  )
  const eligibility = useMemo(
    () =>
      getReviewPromptEligibility({
        appVersion: APP_VERSION,
        isLoggedIn: !!userId,
        isInQuietWindow,
        isPaidUser: isPaidRole(role),
        isPlatformSupported,
        now: new Date(),
        state: reviewState,
      }),
    [isInQuietWindow, isPlatformSupported, reviewState, role, userId],
  )

  useEffect(() => {
    if (!storageKey) {
      setDesktopReviewPromptDebugAction(null)
      setDesktopReviewPromptResetAction(null)
      return
    }

    setDesktopReviewPromptDebugAction(() => {
      presentReviewPrompt({
        source: "manual",
        score: undefined,
        target: getDesktopReviewDebugTarget(),
      })
    })
    setDesktopReviewPromptResetAction(() => {
      clearDesktopReviewPromptState(storageKey)
      hasAttemptedInSessionRef.current = false
      updateReviewState(() => readDesktopReviewPromptState(storageKey))
    })

    return () => {
      setDesktopReviewPromptDebugAction(null)
      setDesktopReviewPromptResetAction(null)
    }
  }, [presentReviewPrompt, storageKey, updateReviewState])

  useEffect(() => {
    const removeTrigger = DebugRegistry.add("Review Prompt", () => {
      presentReviewPrompt({
        source: "manual",
        score: undefined,
        target: getDesktopReviewDebugTarget(),
      })
    })
    const removeReset = DebugRegistry.add("Reset Review Prompt State", () => {
      if (!storageKey) {
        return
      }
      clearDesktopReviewPromptState(storageKey)
      hasAttemptedInSessionRef.current = false
      updateReviewState(() => readDesktopReviewPromptState(storageKey))
    })

    return () => {
      removeTrigger()
      removeReset()
    }
  }, [presentReviewPrompt, storageKey, updateReviewState])

  useEffect(() => {
    if (!userId || hasAttemptedInSessionRef.current || !eligibility.allowed || !rateTarget) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      if (hasAttemptedInSessionRef.current) {
        return
      }

      const latestState = readDesktopReviewPromptState(storageKey)
      const latestEligibility = getReviewPromptEligibility({
        appVersion: APP_VERSION,
        isLoggedIn: !!userId,
        isInQuietWindow: !hasModal && sheetStack.length === 0 && !isRouteBlocked,
        isPaidUser: isPaidRole(roleRef.current),
        isPlatformSupported: distribution !== "unsupported" && !isInMASReview,
        now: new Date(),
        state: latestState,
      })

      if (!latestEligibility.allowed) {
        return
      }

      hasAttemptedInSessionRef.current = true
      lastActionRef.current = null

      tracker.reviewPromptEligible({
        distribution,
        platform,
        score: latestEligibility.score,
        source: "auto",
      })
      presentReviewPrompt({ source: "auto", score: latestEligibility.score })
    }, REVIEW_PROMPT_QUIET_WINDOW_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [
    distribution,
    eligibility.allowed,
    getLatestReviewState,
    hasModal,
    isInMASReview,
    isRouteBlocked,
    platform,
    presentReviewPrompt,
    rateTarget,
    sheetStack.length,
    storageKey,
    userId,
  ])

  return null
}
