import { Button } from "@follow/components/ui/button/index.js"
import { Label } from "@follow/components/ui/label/index.jsx"
import { Switch } from "@follow/components/ui/switch/index.jsx"
import { cn } from "@follow/utils/utils"
import { useCallback, useMemo, useState } from "react"
import { jsx } from "react/jsx-runtime"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import { setAISetting, useAISettingKey } from "~/atoms/settings/ai"
import { GlassButton } from "~/components/ui/button/GlassButton"
import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"

import { OpmlAbstractGraphic } from "../discover/OpmlAbstractGraphic"
import { AICopilotMedia } from "./AICopilotMedia"
import { AppTipMediaPreview } from "./AppTipMediaPreview"
import { OverviewMedia } from "./OverviewMedia"
import type { AppTipStep } from "./types"
import { useNewUserGuideState } from "./useNewUserGuideState"

type AppTipModalContentProps = {
  initialStep?: number
}

export function AppTipModalContent({ initialStep = 0 }: AppTipModalContentProps) {
  const { dismiss } = useCurrentModal()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { persistDismissState } = useNewUserGuideState()

  const [activeStep, setActiveStep] = useState(initialStep)

  const completeOnboarding = useCallback(() => {
    dismiss()
    persistDismissState(true)
  }, [dismiss, persistDismissState])

  const handleNavigateAndClose = useCallback(
    (path: string) => {
      completeOnboarding()
      navigate(path)
    },
    [completeOnboarding, navigate],
  )

  const handleLaunchAiGuide = useCallback(() => {
    completeOnboarding()
    // Import and show AI onboarding modal
    Promise.all([
      import("~/modules/ai-onboarding/ai-onboarding-modal-content"),
      import("~/components/ui/modal/stacked/custom-modal"),
    ]).then(([m, { PlainModal }]) => {
      window.presentModal({
        title: "AI Onboarding",
        content: ({ dismiss }) => (
          <m.AiOnboardingModalContent
            onClose={() => {
              dismiss()
            }}
          />
        ),
        CustomModalComponent: PlainModal,
        modalContainerClassName: "flex items-center justify-center",
        canClose: false,
        clickOutsideToDismiss: false,
        overlay: true,
      })
    })
  }, [completeOnboarding])

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
          reactNode: jsx(OverviewMedia, {}),
        },
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
        media: {
          reactNode: jsx(AICopilotMedia, {}),
        },
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

  const activeStepData = steps[activeStep] ?? steps[0] ?? null
  const hasNextStep = activeStep < steps.length - 1

  if (!activeStepData) return null

  const handleNextStep = () => {
    if (hasNextStep) {
      setActiveStep(activeStep + 1)
    } else {
      completeOnboarding()
    }
  }

  return (
    <section className="shadow-modal relative grid min-h-[500px] overflow-hidden rounded-lg border border-border bg-background text-text lg:grid-cols-[1.2fr,1fr]">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-background">
        {activeStepData.media?.reactNode ? (
          <div className="absolute inset-0 aspect-square w-full overflow-hidden bg-material-medium">
            {activeStepData.media?.reactNode}
          </div>
        ) : (
          <AppTipMediaPreview media={activeStepData.media} />
        )}
      </div>

      <div className="relative flex w-[500px] flex-col border-t border-border bg-background lg:border-l lg:border-t-0">
        <GlassButton
          onClick={completeOnboarding}
          variant="flat"
          className="absolute right-4 top-4 z-10"
          aria-label={t("new_user_dialog.actions.close")}
        >
          <i className="i-mgc-close-cute-re" />
        </GlassButton>
        <div className="flex flex-1 flex-col gap-6 p-8">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-semibold leading-tight text-text">
              {activeStepData.title}
            </h2>
            <p className="text-sm leading-relaxed text-text-secondary">
              {activeStepData.description}
            </p>
          </div>

          <ul className="space-y-2.5 text-sm text-text-secondary">
            {activeStepData.highlights.map((point, idx) => (
              <li key={`${activeStepData.id}-${idx}`} className="flex items-start gap-2.5">
                <span className="mt-2 flex size-1.5 rounded-full bg-text-tertiary" />
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>

          {activeStepData.extra}
        </div>

        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {steps.map((step, idx) => (
                <button
                  type="button"
                  key={step.id}
                  onClick={() => setActiveStep(idx)}
                  aria-label={step.title}
                  aria-current={idx === activeStep}
                  className={cn(
                    "size-2 cursor-pointer rounded-full transition-colors",
                    idx === activeStep ? "bg-text" : "bg-fill-tertiary hover:bg-fill-secondary",
                  )}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={"outline"}
                buttonClassName="h-8"
                onClick={activeStepData.onPrimaryAction}
              >
                {activeStepData.primaryActionLabel}
              </Button>

              <Button size="sm" buttonClassName="h-8" onClick={handleNextStep}>
                {hasNextStep
                  ? t("words.next", { ns: "common" })
                  : t("new_user_dialog.actions.finish")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const AiSplineIndicatorToggle = () => {
  const { t } = useTranslation("ai")
  const showSplineButton = useAISettingKey("showSplineButton")

  return (
    <div className="border-t pt-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Label className="text-sm font-medium text-text">
            {t("settings.showSplineButton.label")}
          </Label>
          <p className="text-xs leading-relaxed text-text-secondary">
            {t("settings.showSplineButton.description")}
          </p>
        </div>

        <Switch
          checked={showSplineButton}
          onCheckedChange={(v) => setAISetting("showSplineButton", v)}
        />
      </div>
    </div>
  )
}
