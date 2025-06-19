import type { FC, PropsWithChildren, ReactNode } from "react"

import type { ModalActionsInternal } from "./context"

export interface ModalOverlayOptions {
  blur?: boolean
  className?: string
}
export interface ModalProps {
  title: ReactNode
  icon?: ReactNode

  CustomModalComponent?: FC<PropsWithChildren>

  content: FC<ModalActionsInternal>
  clickOutsideToDismiss?: boolean
  modalClassName?: string
  modalContainerClassName?: string
  modalContentClassName?: string
  max?: boolean

  wrapper?: FC

  overlay?: boolean
  overlayOptions?: ModalOverlayOptions
  draggable?: boolean
  canClose?: boolean
  resizeable?: boolean
  resizeDefaultSize?: { width: number; height: number }

  modal?: boolean

  autoFocus?: boolean
}

export interface DialogInstance {
  ask: (options: {
    title: string
    message: string
    variant?: "ask" | "warning" | "danger"
    onConfirm?: () => void
    onCancel?: () => void
    confirmText?: string
    cancelText?: string
  }) => Promise<boolean>
}
