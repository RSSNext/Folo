import { Label } from "@follow/components/ui/label/index.jsx"
import { Switch } from "@follow/components/ui/switch/index.jsx"
import { useCallback, useEffect, useMemo, useState } from "react"
import { jsx, jsxs } from "react/jsx-runtime"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import { setAISetting, useAISettingKey } from "~/atoms/settings/ai"

import { OpmlAbstractGraphic } from "../discover/OpmlAbstractGraphic"
import { APP_TIP_DEBUG_EVENT } from "./constants"
import type { AppTipDebugOpenEventDetail, AppTipStep } from "./types"
import { useNewUserGuideState } from "./useNewUserGuideState"

export function useAppTipController() {
  const {
    eligibleForGuide,
    hasDismissed,
    setHasDismissed,
    persistDismissState,
    shouldShowNewUserGuide,
  } = useNewUserGuideState()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [activeStep, setActiveStep] = useState(0)
  const [showAiGuide, setShowAiGuide] = useState(false)
  const [forceOpen, setForceOpen] = useState(false)

  const shouldShowDialog = shouldShowNewUserGuide || forceOpen

  useEffect(() => {
    if (eligibleForGuide && !hasDismissed) {
      setActiveStep(0)
    }
  }, [eligibleForGuide, hasDismissed])

  const completeOnboarding = useCallback(
    (options?: { skipPersistence?: boolean }) => {
      if (!options?.skipPersistence) {
        setHasDismissed(true)
        persistDismissState(true)
      }
      setForceOpen(false)
    },
    [persistDismissState, setHasDismissed],
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

  const AiSplineIndicatorToggle = () => {
    const { t } = useTranslation("ai")
    const showSplineButton = useAISettingKey("showSplineButton")
    return jsxs("div", {
      className: "border-t pt-4",
      children: [
        jsxs("div", {
          className: "flex items-center justify-between gap-4",
          children: [
            jsxs("div", {
              className: "space-y-1",
              children: [
                jsx(Label, {
                  className: "text-sm font-medium text-text",
                  children: t("settings.showSplineButton.label"),
                }),
                jsx("p", {
                  className: "text-xs leading-relaxed text-text-secondary",
                  children: t("settings.showSplineButton.description"),
                }),
              ],
            }),
            jsx(Switch, {
              checked: showSplineButton,
              onCheckedChange: (v: boolean) => setAISetting("showSplineButton", v),
            }),
          ],
        }),
      ],
    })
  }

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

        primaryActionLabel: t("new_user_dialog.overview.primary"),
        onPrimaryAction: () => handleNavigateAndClose("/discover?type=search"),
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

        primaryActionLabel: t("new_user_dialog.ai.primary"),
        onPrimaryAction: handleLaunchAiGuide,
        extra: jsx(AiSplineIndicatorToggle, {}),
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
          reactNode: jsx(OpmlAbstractGraphic, {}),
        },

        primaryActionLabel: t("new_user_dialog.import.primary"),
        onPrimaryAction: () => handleNavigateAndClose("/discover?type=import"),
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
