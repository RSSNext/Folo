import { Button } from "@follow/components/ui/button/index.js"
import { nextFrame } from "@follow/utils/dom"
import type { DragControls } from "framer-motion"
import { atom, useAtomValue } from "jotai"
import type { ResizeCallback, ResizeStartCallback } from "re-resizable"
import { useContext, useId, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { useTranslation } from "react-i18next"
import { useContextSelector } from "use-context-selector"
import { useEventCallback } from "usehooks-ts"

import { getUISettings } from "~/atoms/settings/ui"
import { jotaiStore } from "~/lib/jotai"

import { modalStackAtom } from "./atom"
import { ModalEventBus } from "./bus"
import { CurrentModalContext, CurrentModalStateContext } from "./context"
import type { DialogInstance, ModalProps, ModalStackOptions } from "./types"

export const modalIdToPropsMap = {} as Record<string, ModalProps>
export const useModalStack = (options?: ModalStackOptions) => {
  const id = useId()
  const currentCount = useRef(0)
  const { wrapper } = options || {}

  return {
    present: useEventCallback((props: ModalProps & { id?: string }) => {
      const presentSync = (props: ModalProps & { id?: string }) => {
        const fallbackModelId = `${id}-${++currentCount.current}`
        const modalId = props.id ?? fallbackModelId

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

              wrapper,
            }
            modalIdToPropsMap[modalId] = modalProps
            return p.concat({
              id: modalId,
              ...modalProps,
            })
          })
        }

        return () => {
          jotaiStore.set(modalStackAtom, (p) => p.filter((item) => item.id !== modalId))
        }
      }

      return nextFrame(() => presentSync(props))
    }),

    ...actions,
  }
}
const actions = {
  getTopModalStack() {
    return jotaiStore.get(modalStackAtom).at(-1)
  },
  getModalStackById(id: string) {
    return jotaiStore.get(modalStackAtom).find((item) => item.id === id)
  },
  dismiss(id: string) {
    ModalEventBus.dispatch("MODAL_DISPATCH", {
      type: "dismiss",
      id,
    })
  },
  dismissTop() {
    const topModal = actions.getTopModalStack()

    if (!topModal) return
    actions.dismiss(topModal.id)
  },
  dismissAll() {
    const modalStack = jotaiStore.get(modalStackAtom)
    modalStack.forEach((item) => actions.dismiss(item.id))
  },
}

export const useCurrentModal = () => useContext(CurrentModalContext)

export const useResizeableModal = (
  modalElementRef: React.RefObject<HTMLDivElement>,
  {
    enableResizeable,
    dragControls,
  }: {
    enableResizeable: boolean
    dragControls?: DragControls
  },
) => {
  const [resizeableStyle, setResizeableStyle] = useState({} as React.CSSProperties)
  const [isResizeable, setIsResizeable] = useState(false)
  const [preferDragDir, setPreferDragDir] = useState<"x" | "y" | null>(null)

  const relocateModal = useEventCallback(() => {
    if (!enableResizeable) return
    if (isResizeable) return
    const $modalElement = modalElementRef.current
    if (!$modalElement) return

    const rect = $modalElement.getBoundingClientRect()
    const { x, y } = rect

    flushSync(() => {
      setIsResizeable(true)
      setResizeableStyle({
        position: "fixed",
        top: `${y}px`,
        left: `${x}px`,
      })
    })
  })
  const handleResizeStart = useEventCallback(((e, dir) => {
    if (!enableResizeable) return
    relocateModal()

    const hasTop = /top/i.test(dir)
    const hasLeft = /left/i.test(dir)
    if (hasTop || hasLeft) {
      dragControls?.start(e as any)
      if (hasTop && hasLeft) {
        setPreferDragDir(null)
      } else if (hasTop) {
        setPreferDragDir("y")
      } else if (hasLeft) {
        setPreferDragDir("x")
      }
    }
  }) satisfies ResizeStartCallback)
  const handleResizeStop = useEventCallback((() => {
    setPreferDragDir(null)
  }) satisfies ResizeCallback)

  return {
    resizeableStyle,
    isResizeable,
    relocateModal,
    handleResizeStart,
    handleResizeStop,
    preferDragDir,
  }
}

export const useIsTopModal = () => useContextSelector(CurrentModalStateContext, (v) => v.isTop)

export const useDialog = (): DialogInstance => {
  const { present } = useModalStack()
  const { t } = useTranslation()
  return {
    ask: useEventCallback((options) => {
      return new Promise<boolean>((resolve) => {
        present({
          title: options.title,
          content: ({ dismiss }) => (
            <div className="flex max-w-[75ch] flex-col gap-3">
              {options.message}

              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    options.onCancel?.()
                    resolve(false)
                    dismiss()
                  }}
                >
                  {options.cancelText ?? t("words.cancel", { ns: "common" })}
                </Button>
                <Button
                  onClick={() => {
                    options.onConfirm?.()
                    resolve(true)
                    dismiss()
                  }}
                >
                  {options.confirmText ?? t("words.confirm", { ns: "common" })}
                </Button>
              </div>
            </div>
          ),
          canClose: true,
          clickOutsideToDismiss: false,
        })
      })
    }),
  }
}

const modalStackLengthAtom = atom((get) => get(modalStackAtom).length)
export const useHasModal = () => useAtomValue(modalStackLengthAtom) > 0
