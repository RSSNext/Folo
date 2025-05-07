import type { FC, PropsWithChildren } from "react"

import { ModalStack } from "./modal-stack"
import type { ModalProps } from "./types"

declare global {
  interface Window {
    presentModal: (modal: ModalProps) => void
  }
}

export const ModalStackProvider: FC<PropsWithChildren> = ({ children }) => (
  <>
    {children}
    <ModalStack />
  </>
)
