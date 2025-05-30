import { RootPortal } from "@follow/components/ui/portal/index.jsx"
import { useState } from "react"

import { PlainModal } from "~/components/ui/modal/stacked/custom-modal"
import { DeclarativeModal } from "~/components/ui/modal/stacked/declarative-modal"

import { GuideModalContent } from "./guide-modal-content"

export const NewUserGuideModal = () => {
  const [open, setOpen] = useState(true)
  return (
    <RootPortal>
      <DeclarativeModal
        id="new-user-guide"
        title="New User Guide"
        CustomModalComponent={PlainModal}
        modalContainerClassName="flex items-center justify-center"
        open={open}
        canClose={false}
        clickOutsideToDismiss={false}
        overlay
      >
        <GuideModalContent onClose={() => setOpen(false)} />
      </DeclarativeModal>
    </RootPortal>
  )
}
