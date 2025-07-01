import { nanoid } from "nanoid/non-secure"
import type { PropsWithChildren, ReactNode } from "react"
import { createContext, use, useCallback, useMemo, useState } from "react"
import { View } from "react-native"
import { useEventCallback } from "usehooks-ts"

import type { BottomModalProps } from "./BottomModal"
import { BottomModal } from "./BottomModal"

export type Modal = { id: string; content: ReactNode } & Omit<
  BottomModalProps,
  "visible" | "children"
>

export type ModalInput = Omit<Modal, "id" | "closeOnBackdropPress"> & {
  /**
   * Optional: Will be auto-generated with nanoid if not provided
   */
  id?: string
  /**
   * Default is true
   */
  closeOnBackdropPress?: false
  /**
   * Select template for the modal.
   *
   * @default 'plain'
   */
  type?: "plain" // | 'select' | 'confirm' | 'input' | 'custom'
}

const ModalContext = createContext<{
  isModalActive: boolean
  activeModals: Modal[]
}>({
  isModalActive: false,
  activeModals: [],
})

const ModalControlContext = createContext<{
  openModal: (modal: ModalInput) => Promise<void>
  closeModal: (id?: string) => boolean
  closeAllModals: () => boolean
}>({
  openModal: () => {
    console.error("useModal must be used within ImperativeModalProvider")
    return Promise.resolve()
  },
  closeModal: () => {
    console.error("useModal must be used within ImperativeModalProvider")
    return false
  },
  closeAllModals: () => {
    console.error("useModal must be used within ImperativeModalProvider")
    return false
  },
})

export function ImperativeModalProvider({ children }: PropsWithChildren) {
  const [activeModals, setActiveModals] = useState<Modal[]>([])

  const openModal = useEventCallback((modal: ModalInput) => {
    const promise = Promise.withResolvers<void>()

    // TODO add other modal types like 'select', 'confirm', 'input', etc.
    const content = !modal.type || modal.type === "plain" ? modal.content : null

    setActiveModals((modals) => [
      ...modals,
      {
        id: nanoid(),
        ...modal,
        content,
        onClose: () => {
          modal.onClose?.()
          promise.resolve()
        },
      },
    ])

    return promise.promise
  })

  const closeModal = useEventCallback((id) => {
    const wasActive = id ? activeModals.some((modal) => modal.id === id) : activeModals.length > 0
    setActiveModals((modals) => {
      if (id) {
        return modals.filter((modal) => modal.id !== id)
      }
      return modals.slice(0, -1)
    })
    return wasActive
  })

  const closeAllModals = useEventCallback(() => {
    const wasActive = activeModals.length > 0
    setActiveModals([])
    return wasActive
  })

  const state = useMemo(
    () => ({
      isModalActive: activeModals.length > 0,
      activeModals,
    }),
    [activeModals],
  )

  const methods = useMemo(
    () => ({
      openModal,
      closeModal,
      closeAllModals,
    }),
    [openModal, closeModal, closeAllModals],
  )

  return (
    <ModalContext value={state}>
      <ModalControlContext value={methods}>
        {children}
        <View>
          <ImperativeModal />
        </View>
      </ModalControlContext>
    </ModalContext>
  )
}

const ImperativeModal = () => {
  const modals = useModals()
  const { closeModal } = useModalControls()

  const onClose = useCallback(
    (id: string) => {
      closeModal(id)
    },
    [closeModal],
  )

  return modals.activeModals.map((modal) => (
    <BottomModal
      key={modal.id}
      // Always visible when rendered as it's actively shown in the modal stack
      visible={true}
      {...modal}
      onClose={() => {
        modal.onClose?.()
        onClose(modal.id)
      }}
    >
      {modal.content}
    </BottomModal>
  ))
}

export function useModals() {
  return use(ModalContext)
}

export function useModalControls() {
  return use(ModalControlContext)
}
