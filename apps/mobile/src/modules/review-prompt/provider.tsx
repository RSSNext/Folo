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
import { nativeApplicationVersion } from "expo-application"
import { useAtomValue } from "jotai"
import { useEffect, useMemo, useRef, useState } from "react"
import type { AppStateStatus } from "react-native"
import { AppState, InteractionManager } from "react-native"

import { dialogCountAtom } from "@/src/lib/dialog-state"
import { Navigation } from "@/src/lib/navigation/Navigation"
import { PlanScreen } from "@/src/modules/settings/routes/Plan"
import { LoginScreen } from "@/src/screens/(modal)/LoginScreen"
import { OnboardingScreen } from "@/src/screens/OnboardingScreen"

import { setMobileReviewPromptDebugAction, setMobileReviewPromptResetAction } from "./debug"
import { useMobileReviewPromptState } from "./use-review-prompt-state"
import {
  clearMobileReviewPromptState,
  isMobileNativeReviewAvailable,
  readMobileReviewPromptState,
  requestMobileNativeReview,
  REVIEW_PROMPT_QUIET_WINDOW_MS,
  writeMobileReviewPromptState,
} from "./utils"

const { routesAtom } = Navigation.rootNavigation.__dangerous_getCtxValue()

export const ReviewPromptProvider = () => {
  const { currentState } = AppState
  const role = useUserRole()
  const routes = useAtomValue(routesAtom)
  const dialogCount = useAtomValue(dialogCountAtom)
  const feedSubscriptions = useAllFeedSubscription()
  const listSubscriptions = useAllListSubscription()

  const {
    distribution,
    getLatestReviewState,
    platform,
    reviewState,
    storageKey,
    updateReviewState,
    userId,
  } = useMobileReviewPromptState()

  const [appState, setAppState] = useState(currentState)
  const hasAttemptedInSessionRef = useRef(false)
  const isHandlingPromptRef = useRef(false)
  const roleRef = useRef(role)
  const subscriptionCountRef = useRef(feedSubscriptions.length + listSubscriptions.length)
  const appStateRef = useRef(appState)
  const dialogCountRef = useRef(dialogCount)
  const routesRef = useRef(routes)

  subscriptionCountRef.current = feedSubscriptions.length + listSubscriptions.length
  appStateRef.current = appState
  dialogCountRef.current = dialogCount
  routesRef.current = routes

  useEffect(() => {
    hasAttemptedInSessionRef.current = false
    isHandlingPromptRef.current = false
  }, [storageKey])

  useEffect(() => {
    if (!userId) {
      return
    }

    const recordActiveDay = () => {
      updateReviewState((state) => recordReviewPromptActiveDay(state, new Date()))
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      setAppState(nextAppState)
      if (nextAppState === "active") {
        recordActiveDay()
      }
    }

    recordActiveDay()

    // React Native AppState subscriptions are cleaned up with subscription.remove().
    // eslint-disable-next-line @eslint-react/web-api/no-leaked-event-listener
    const subscription = AppState.addEventListener("change", handleAppStateChange)

    return () => {
      subscription.remove()
    }
  }, [updateReviewState, userId])

  useEffect(() => {
    if (!userId) {
      roleRef.current = role
      return
    }

    const wasPaidUser = roleRef.current === UserRole.Pro || roleRef.current === UserRole.Plus
    const isPaidUser = role === UserRole.Pro || role === UserRole.Plus
    if (isPaidUser && !wasPaidUser) {
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

  const activeRoute = routes.at(-1) ?? null
  const hasPresentedRoute = routes.some((route) => route.type !== "push")
  const isBlockedRoute =
    activeRoute?.Component === LoginScreen ||
    activeRoute?.Component === OnboardingScreen ||
    activeRoute?.Component === PlanScreen

  const isPaidUser = role === UserRole.Pro || role === UserRole.Plus
  const isInQuietWindow =
    appState === "active" && !hasPresentedRoute && dialogCount === 0 && !isBlockedRoute
  const isPlatformSupported = distribution !== "unsupported"

  useEffect(() => {
    if (!storageKey) {
      setMobileReviewPromptDebugAction(null)
      setMobileReviewPromptResetAction(null)
      return
    }

    setMobileReviewPromptDebugAction(async () => {
      const latestState = readMobileReviewPromptState(storageKey)
      if (!(await isMobileNativeReviewAvailable(distribution))) {
        return
      }

      tracker.reviewPromptShown({ distribution, platform, source: "manual" })
      const nextState = await requestMobileNativeReview({
        appVersion: nativeApplicationVersion ?? "unknown",
        distribution,
        platform,
        source: "manual",
        state: latestState,
        storageKey,
        trackPositive: true,
      })
      writeMobileReviewPromptState(storageKey, nextState)
      updateReviewState(() => nextState)
    })
    setMobileReviewPromptResetAction(() => {
      clearMobileReviewPromptState(storageKey)
      hasAttemptedInSessionRef.current = false
      isHandlingPromptRef.current = false
      updateReviewState(() => readMobileReviewPromptState(storageKey))
    })

    return () => {
      setMobileReviewPromptDebugAction(null)
      setMobileReviewPromptResetAction(null)
    }
  }, [distribution, platform, storageKey, updateReviewState])

  const eligibility = useMemo(
    () =>
      getReviewPromptEligibility({
        appVersion: nativeApplicationVersion ?? "unknown",
        isLoggedIn: !!userId,
        isInQuietWindow,
        isPaidUser,
        isPlatformSupported,
        now: new Date(),
        state: reviewState,
      }),
    [isInQuietWindow, isPaidUser, isPlatformSupported, reviewState, userId],
  )

  useEffect(() => {
    if (
      !userId ||
      hasAttemptedInSessionRef.current ||
      isHandlingPromptRef.current ||
      !eligibility.allowed
    ) {
      return
    }

    const timeoutId = setTimeout(() => {
      if (hasAttemptedInSessionRef.current || isHandlingPromptRef.current) {
        return
      }

      isHandlingPromptRef.current = true

      void InteractionManager.runAfterInteractions(async () => {
        const latestState = getLatestReviewState()
        const latestEligibility = getReviewPromptEligibility({
          appVersion: nativeApplicationVersion ?? "unknown",
          isLoggedIn: !!userId,
          isInQuietWindow:
            appStateRef.current === "active" &&
            !routesRef.current.some((route) => route.type !== "push") &&
            dialogCountRef.current === 0 &&
            !isBlockedRoute,
          isPaidUser: roleRef.current === UserRole.Pro || roleRef.current === UserRole.Plus,
          isPlatformSupported: distribution !== "unsupported",
          now: new Date(),
          state: latestState,
        })

        if (!latestEligibility.allowed) {
          isHandlingPromptRef.current = false
          return
        }

        const nativeAvailable = await isMobileNativeReviewAvailable(distribution)
        if (!nativeAvailable) {
          isHandlingPromptRef.current = false
          return
        }

        tracker.reviewPromptEligible({
          distribution,
          platform,
          score: latestEligibility.score,
          source: "auto",
        })
        tracker.reviewPromptShown({
          distribution,
          platform,
          score: latestEligibility.score,
          source: "auto",
        })

        const nextState = await requestMobileNativeReview({
          appVersion: nativeApplicationVersion ?? "unknown",
          distribution,
          platform,
          score: latestEligibility.score,
          source: "auto",
          state: latestState,
          storageKey,
        })

        updateReviewState(() => nextState)
        hasAttemptedInSessionRef.current = true
        isHandlingPromptRef.current = false
      })
    }, REVIEW_PROMPT_QUIET_WINDOW_MS)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [
    dialogCount,
    distribution,
    eligibility.allowed,
    getLatestReviewState,
    isBlockedRoute,
    platform,
    routes,
    storageKey,
    updateReviewState,
    userId,
  ])

  return null
}
