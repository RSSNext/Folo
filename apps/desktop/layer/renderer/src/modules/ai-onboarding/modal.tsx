import { RootPortal } from "@follow/components/ui/portal/index.jsx"
import { useState } from "react"

import { PlainModal } from "~/components/ui/modal/stacked/custom-modal"
import { DeclarativeModal } from "~/components/ui/modal/stacked/declarative-modal"

import { AiOnboardingModalContent } from "./ai-onboarding-modal-content"

export const AiOnboardingModal = () => {
  const [open, setOpen] = useState(true)
  return (
    <RootPortal>
      <DeclarativeModal
        id="ai-onboarding"
        title="AI Onboarding"
        CustomModalComponent={PlainModal}
        modalContainerClassName="flex items-center justify-center"
        open={open}
        canClose={false}
        clickOutsideToDismiss={false}
        overlay
      >
        <AiOnboardingModalContent onClose={() => setOpen(false)} />
      </DeclarativeModal>
    </RootPortal>
  )
}
