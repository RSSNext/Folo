import { Spring } from "@follow/components/constants/spring.js"
import { RootPortal } from "@follow/components/ui/portal/index.jsx"
import { m } from "motion/react"
import type { PropsWithChildren } from "react"
import { useState } from "react"

import { DeclarativeModal } from "~/components/ui/modal/stacked/declarative-modal"

import { AiOnboardingModalContent } from "./ai-onboarding-modal-content"

const Modal = ({ children }: PropsWithChildren) => {
  return (
    <div className="center h-full">
      <m.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={Spring.presets.smooth}
        className="relative flex h-[85vh] w-[90vw] max-w-[1400px] flex-col overflow-hidden"
      >
        <div className="relative z-10 flex size-full flex-col overflow-hidden">{children}</div>
      </m.div>
    </div>
  )
}

export const AiOnboardingModal = () => {
  const [open, setOpen] = useState(true)
  return (
    <RootPortal>
      <DeclarativeModal
        id="ai-onboarding"
        title="AI Onboarding"
        CustomModalComponent={Modal}
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
