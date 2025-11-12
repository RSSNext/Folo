import { useWhoami } from "@follow/store/user/hooks"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import { useAuthQuery } from "~/hooks/common/useBizQuery"
import { settings } from "~/queries/settings"

import {
  APP_TIP_DEBUG_EVENT,
  APP_TIP_PREVIEW_VIDEO_POSTER,
  APP_TIP_PREVIEW_VIDEO_SRC,
  APP_TIP_STORAGE_PREFIX,
} from "./constants"
import type { AppTipDebugOpenEventDetail, AppTipStep } from "./types"

export function useAppTipController() {
  const user = useWhoami()
  const { data: remoteSettings, isLoading } = useAuthQuery(settings.get(), {})
  const navigate = useNavigate()
  const { t } = useTranslation()

  const dismissKey = user ? `${APP_TIP_STORAGE_PREFIX}:${user.id}` : null
  const [hasDismissed, setHasDismissed] = useState(() => readDismissed(dismissKey))

  useEffect(() => {
    setHasDismissed(readDismissed(dismissKey))
  }, [dismissKey])

  const [activeStep, setActiveStep] = useState(0)
  const [showAiGuide, setShowAiGuide] = useState(false)
  const [forceOpen, setForceOpen] = useState(false)

  const isNewUser =
    !isLoading && remoteSettings && Object.keys(remoteSettings.updated ?? {}).length === 0
  const eligibleForGuide = Boolean(user && isNewUser)
  const shouldShowDialog = (eligibleForGuide && !hasDismissed) || forceOpen

  useEffect(() => {
    if (eligibleForGuide && !hasDismissed) {
      setActiveStep(0)
    }
  }, [eligibleForGuide, hasDismissed])

  const persistDismissState = useCallback(
    (next: boolean) => {
      if (!dismissKey || typeof window === "undefined") return

      if (next) {
        window.localStorage.setItem(dismissKey, "1")
      } else {
        window.localStorage.removeItem(dismissKey)
      }
    },
    [dismissKey],
  )

  const completeOnboarding = useCallback(
    (options?: { skipPersistence?: boolean }) => {
      if (!options?.skipPersistence) {
        setHasDismissed(true)
        persistDismissState(true)
      }
      setForceOpen(false)
    },
    [persistDismissState],
  )

  const handleDismiss = useCallback(() => {
    if (forceOpen) {
      setForceOpen(false)
      setShowAiGuide(false)
      return
    }
    completeOnboarding()
  }, [completeOnboarding, forceOpen, setShowAiGuide])

  const handleNavigateAndClose = useCallback(
    (path: string) => {
      if (forceOpen) {
        setForceOpen(false)
      } else {
        completeOnboarding()
      }
      navigate(path)
    },
    [completeOnboarding, forceOpen, navigate],
  )

  const handleLaunchAiGuide = useCallback(() => {
    if (forceOpen) {
      setForceOpen(false)
    } else {
      completeOnboarding()
    }
    setShowAiGuide(true)
  }, [completeOnboarding, forceOpen, setShowAiGuide])

  const steps = useMemo<AppTipStep[]>(() => {
    return [
      {
        id: "overview",
        title: t("new_user_dialog.overview.title"),
        description: t("new_user_dialog.overview.description"),
        highlights: [
          t("new_user_dialog.overview.highlight_1"),
          t("new_user_dialog.overview.highlight_2"),
          t("new_user_dialog.overview.highlight_3"),
        ],
        media: {
          src: APP_TIP_PREVIEW_VIDEO_SRC,
          poster: APP_TIP_PREVIEW_VIDEO_POSTER,
          caption: t("new_user_dialog.video_caption"),
        },
        primaryActionLabel: t("new_user_dialog.overview.primary"),
        onPrimaryAction: () => handleNavigateAndClose("/discover?type=search"),
        secondaryActionLabel: t("new_user_dialog.actions.next_step"),
        onSecondaryAction: () => setActiveStep(1),
      },
      {
        id: "ai",
        title: t("new_user_dialog.ai.title"),
        description: t("new_user_dialog.ai.description"),
        highlights: [
          t("new_user_dialog.ai.highlight_1"),
          t("new_user_dialog.ai.highlight_2"),
          t("new_user_dialog.ai.highlight_3"),
        ],
        media: {
          src: APP_TIP_PREVIEW_VIDEO_SRC,
          poster: APP_TIP_PREVIEW_VIDEO_POSTER,
          caption: t("new_user_dialog.video_caption"),
        },
        primaryActionLabel: t("new_user_dialog.ai.primary"),
        onPrimaryAction: handleLaunchAiGuide,
        secondaryActionLabel: t("new_user_dialog.actions.next_step"),
        onSecondaryAction: () => setActiveStep(2),
      },
      {
        id: "import",
        title: t("new_user_dialog.import.title"),
        description: t("new_user_dialog.import.description"),
        highlights: [
          t("new_user_dialog.import.highlight_1"),
          t("new_user_dialog.import.highlight_2"),
          t("new_user_dialog.import.highlight_3"),
        ],
        media: {
          src: APP_TIP_PREVIEW_VIDEO_SRC,
          poster: APP_TIP_PREVIEW_VIDEO_POSTER,
          caption: t("new_user_dialog.video_caption"),
        },
        primaryActionLabel: t("new_user_dialog.import.primary"),
        onPrimaryAction: () => handleNavigateAndClose("/discover?type=import"),
        secondaryActionLabel: t("new_user_dialog.actions.previous_step"),
        onSecondaryAction: () => setActiveStep(1),
      },
    ]
  }, [handleLaunchAiGuide, handleNavigateAndClose, t])

  useEffect(() => {
    const listener: EventListener = (event) => {
      const { detail } = event as CustomEvent<AppTipDebugOpenEventDetail>
      setForceOpen(true)
      setHasDismissed(false)
      setShowAiGuide(Boolean(detail?.openAiGuide))
      if (steps.length > 0 && typeof detail?.step === "number") {
        const boundedIndex = Math.min(Math.max(detail.step, 0), steps.length - 1)
        setActiveStep(boundedIndex)
      } else {
        setActiveStep(0)
      }
    }
    window.addEventListener(APP_TIP_DEBUG_EVENT, listener)
    return () => {
      window.removeEventListener(APP_TIP_DEBUG_EVENT, listener)
    }
  }, [steps.length])

  const activeStepData = steps[activeStep] ?? steps[0] ?? null

  return {
    shouldShowDialog,
    showAiGuide,
    steps,
    activeStepData,
    activeStepIndex: activeStep,
    handleDismiss,
    setActiveStep,
  }
}

function readDismissed(key: string | null) {
  if (!key || typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(key) === "1"
  } catch {
    return false
  }
}
