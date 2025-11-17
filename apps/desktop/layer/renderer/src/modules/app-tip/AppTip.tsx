import { lazy, Suspense } from "react"

import { AppTipDialog } from "./AppTipDialog"
import { useAppTipController } from "./useAppTipController"

const LazyAppTipModal = lazy(() =>
  import("~/modules/ai-onboarding/modal").then((m) => ({ default: m.AiOnboardingModal })),
)

export function AppTip() {
  const {
    shouldShowDialog,
    showAiGuide,
    activeStepData,
    steps,
    activeStepIndex,
    handleDismiss,
    setActiveStep,
  } = useAppTipController()

  if (!activeStepData) return null

  return (
    <>
      <AppTipDialog
        open={shouldShowDialog}
        steps={steps}
        activeStep={activeStepData}
        activeStepIndex={activeStepIndex}
        onSelectStep={(idx) => setActiveStep(idx)}
        onDismiss={handleDismiss}
        hasNextStep={activeStepIndex < steps.length - 1}
      />

      {showAiGuide && (
        <Suspense fallback={null}>
          <LazyAppTipModal />
        </Suspense>
      )}
    </>
  )
}
