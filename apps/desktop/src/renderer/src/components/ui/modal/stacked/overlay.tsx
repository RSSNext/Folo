import { cn } from "@follow/utils/utils"
import * as Dialog from "@radix-ui/react-dialog"
import { AnimatePresence } from "motion/react"
import type { ForwardedRef } from "react"
import { forwardRef } from "react"

import { m } from "~/components/common/Motion"

export const ModalOverlay = forwardRef(
  (
    {
      zIndex,
      blur,
      className,
      hidden,
    }: {
      zIndex?: number
      blur?: boolean
      className?: string
      hidden?: boolean
    },
    ref: ForwardedRef<HTMLDivElement>,
  ) => (
    <Dialog.Overlay>
      <AnimatePresence>
        {!hidden && (
          <m.div
            ref={ref}
            id="modal-overlay"
            className={cn(
              // NOTE: pointer-events-none is required, if remove this, when modal is closing, you can not click element behind the modal
              "!pointer-events-none fixed inset-0 rounded-[var(--fo-window-radius)] bg-zinc-50/80 dark:bg-neutral-900/80",
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
  ),
)
