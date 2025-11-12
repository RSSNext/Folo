import { Button } from "@follow/components/ui/button/index.js"
import { cn } from "@follow/utils/utils"
import { useTranslation } from "react-i18next"

import { GlassButton } from "~/components/ui/button/GlassButton"
import { PlainWithAnimationModal } from "~/components/ui/modal/stacked/custom-modal"
import { DeclarativeModal } from "~/components/ui/modal/stacked/declarative-modal"

import { AppTipMediaPreview } from "./AppTipMediaPreview"
import type { AppTipStep } from "./types"

type AppTipDialogProps = {
  steps: AppTipStep[]
  activeStep: AppTipStep
  activeStepIndex: number
  onSelectStep: (index: number) => void
  onDismiss: () => void
  open: boolean
}

export function AppTipDialog({
  steps,
  activeStep,
  activeStepIndex,
  onSelectStep,
  onDismiss,
  open,
}: AppTipDialogProps) {
  const { t } = useTranslation()
  return (
    <DeclarativeModal
      id="ai-onboarding"
      title={t("new_user_dialog.title")}
      CustomModalComponent={PlainWithAnimationModal}
      modalContainerClassName="flex items-center justify-center"
      modalClassName="w-full max-w-5xl"
      open={open}
      overlay={false}
      canClose={false}
      clickOutsideToDismiss={false}
    >
      <section className="shadow-modal relative grid min-h-[500px] overflow-hidden rounded-lg border border-border bg-background text-text lg:grid-cols-[1.2fr,1fr]">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-background">
          <AppTipMediaPreview media={activeStep.media} />
        </div>

        <div className="relative flex w-[500px] flex-col border-t border-border bg-background lg:border-l lg:border-t-0">
          <GlassButton
            onClick={onDismiss}
            className="absolute right-4 top-4 z-10"
            aria-label={t("new_user_dialog.actions.close")}
          >
            <i className="i-mgc-close-cute-re" />
          </GlassButton>
          <div className="flex flex-1 flex-col gap-6 p-8">
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-semibold leading-tight text-text">{activeStep.title}</h2>
              <p className="text-sm leading-relaxed text-text-secondary">
                {activeStep.description}
              </p>
            </div>

            <ul className="space-y-2.5 text-sm text-text-secondary">
              {activeStep.highlights.map((point, idx) => (
                <li key={`${activeStep.id}-${idx}`} className="flex items-start gap-2.5">
                  <span className="mt-2 flex size-1.5 rounded-full bg-text-tertiary" />
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {steps.map((step, idx) => (
                  <button
                    type="button"
                    key={step.id}
                    onClick={() => onSelectStep(idx)}
                    aria-label={step.title}
                    aria-current={idx === activeStepIndex}
                    className={cn(
                      "size-2 cursor-pointer rounded-full transition-colors",
                      idx === activeStepIndex
                        ? "bg-text"
                        : "bg-fill-tertiary hover:bg-fill-secondary",
                    )}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {activeStep.secondaryActionLabel && activeStep.onSecondaryAction && (
                  <Button
                    variant="outline"
                    size="sm"
                    buttonClassName="h-8"
                    onClick={activeStep.onSecondaryAction}
                  >
                    {activeStep.secondaryActionLabel}
                  </Button>
                )}
                <Button size="sm" buttonClassName="h-8" onClick={activeStep.onPrimaryAction}>
                  {activeStep.primaryActionLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </DeclarativeModal>
  )
}
