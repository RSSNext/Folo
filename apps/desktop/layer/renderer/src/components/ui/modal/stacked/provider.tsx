import { nextFrame } from "@follow/utils/dom"
import type { FC, PropsWithChildren } from "react"
import { useId, useRef } from "react"
import { useEventCallback } from "usehooks-ts"

import { getUISettings } from "~/atoms/settings/ui"
import { jotaiStore } from "~/lib/jotai"

import { modalStackAtom } from "./atom"
import { PresentModalContextInternal } from "./context"
import { modalIdToPropsMap } from "./hooks"
import { ModalStack } from "./modal-stack"
import type { ModalProps } from "./types"

declare global {
  interface Window {
    presentModal: (modal: ModalProps & { id?: string }) => void
  }
}

export const ModalStackProvider: FC<PropsWithChildren> = ({ children }) => {
  const id = useId()
  const currentCount = useRef(0)
  const presentModal = useEventCallback((props: ModalProps & { id?: string }) => {
    const fallbackModelId = `${id}-${++currentCount.current}`
    const modalId = props.id ?? fallbackModelId
    const presentSync = (props: ModalProps & { id?: string }) => {
      const currentStack = jotaiStore.get(modalStackAtom)

      const existingModal = currentStack.find((item) => item.id === modalId)

      if (existingModal) {
        // Move to top
        jotaiStore.set(modalStackAtom, (p) => {
          const index = p.indexOf(existingModal)
          return [...p.slice(0, index), ...p.slice(index + 1), existingModal]
        })
      } else {
        // NOTE: The props of the Command Modal are immutable, so we'll just take the store value and inject it.
        // There is no need to inject `overlay` props, this is rendered responsively based on ui changes.
        const uiSettings = getUISettings()
        const modalConfig: Partial<ModalProps> = {
          draggable: uiSettings.modalDraggable,
          modal: true,
        }
        jotaiStore.set(modalStackAtom, (p) => {
          const modalProps: ModalProps = {
            ...modalConfig,
            ...props,
          }
          modalIdToPropsMap[modalId] = modalProps
          return p.concat({
            id: modalId,
            ...modalProps,
          })
        })
      }
    }

    nextFrame(() => presentSync(props))

    return () => {
      jotaiStore.set(modalStackAtom, (p) => p.filter((item) => item.id !== modalId))
    }
  })

  return (
    <PresentModalContextInternal value={presentModal}>
      {children}
      <ModalStack />
    </PresentModalContextInternal>
  )
}
