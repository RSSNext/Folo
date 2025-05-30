import { cn } from "@follow/utils/utils"
import * as Dialog from "@radix-ui/react-dialog"
import { AnimatePresence } from "motion/react"
import type { FC } from "react"

import { m } from "~/components/common/Motion"

export const ModalOverlay: FC<{
  ref?: React.Ref<HTMLDivElement | null>
  zIndex?: number
  blur?: boolean
  className?: string
  hidden?: boolean
}> = ({ ref, zIndex, blur, className, hidden }) => (
  <Dialog.Overlay>
    <AnimatePresence>
      {!hidden && (
        <m.div
          ref={ref}
          id="modal-overlay"
          className={cn(
            // NOTE: pointer-events-none is required, if remove this, when modal is closing, you can not click element behind the modal
            "bg-material-ultra-thick !pointer-events-none fixed inset-0 rounded-[var(--fo-window-radius)]",
            blur && "backdrop-blur-sm",
            className,
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ zIndex }}
        />
      )}
    </AnimatePresence>
  </Dialog.Overlay>
)
