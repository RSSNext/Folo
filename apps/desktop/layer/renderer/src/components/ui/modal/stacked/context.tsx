import type { FC, RefObject } from "react"
import { createContext as reactCreateContext } from "react"
import { createContext as createContextSelector } from "use-context-selector"

import type { ModalProps } from "./types"

export type CurrentModalContentProps = ModalActionsInternal & {
  ref: RefObject<HTMLElement | null>
  modalElementRef: RefObject<HTMLElement | null>
}

const warnNoProvider = () => {
  if (import.meta.env.DEV) {
    console.error(
      "No ModalProvider found, please make sure to wrap your component with ModalProvider",
    )
  }
}
const defaultCtxValue: CurrentModalContentProps = {
  dismiss: warnNoProvider,
  setClickOutSideToDismiss: warnNoProvider,
  ref: { current: null },
  modalElementRef: { current: null },
  getIndex: () => 0,
}

export const CurrentModalContext = reactCreateContext<CurrentModalContentProps>(defaultCtxValue)
export const CurrentModalStateContext = createContextSelector<{
  isTop: boolean
  isInModal: boolean
}>({
  isTop: true,
  isInModal: false,
})

export type ModalContentComponent<T = object> = FC<ModalActionsInternal & T>
export type ModalActionsInternal = {
  dismiss: () => void
  setClickOutSideToDismiss: (value: boolean) => void
  getIndex: () => number
}

type Disposer = () => void
type PresentModalContextInternalFn = (props: ModalProps & { id?: string }) => Disposer
export const PresentModalContextInternal = reactCreateContext<PresentModalContextInternalFn>(() => {
  warnNoProvider()
  return () => {}
})
