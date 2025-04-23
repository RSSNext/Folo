import { RootPortalProvider } from "@follow/components/ui/portal/provider.js"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/index.js"
import { ZIndexProvider } from "@follow/components/ui/z-index/index.js"
import { useRefValue } from "@follow/hooks"
import { ELECTRON_BUILD } from "@follow/shared/constants"
import { nextFrame, preventDefault, stopPropagation } from "@follow/utils/dom"
import { cn, getOS } from "@follow/utils/utils"
import * as Dialog from "@radix-ui/react-dialog"
import { produce } from "immer"
import { useAtomValue, useSetAtom } from "jotai"
import { selectAtom } from "jotai/utils"
import type { BoundingBox } from "motion/react"
import { Resizable } from "re-resizable"
import type { FC, PropsWithChildren, SyntheticEvent } from "react"
import {
  createElement,
  forwardRef,
  Fragment,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import { useEventCallback } from "usehooks-ts"

import { useUISettingKey } from "~/atoms/settings/ui"
import { AppErrorBoundary } from "~/components/common/AppErrorBoundary"
import { SafeFragment } from "~/components/common/Fragment"
import { m } from "~/components/common/Motion"
import { ErrorComponentType } from "~/components/errors/enum"
import { ElECTRON_CUSTOM_TITLEBAR_HEIGHT } from "~/constants"
import { useSwitchHotKeyScope } from "~/hooks/common"

import { modalStackAtom } from "./atom"
import { MODAL_STACK_Z_INDEX, modalMontionConfig } from "./constants"
import type { CurrentModalContentProps, ModalActionsInternal } from "./context"
import { CurrentModalContext, CurrentModalStateContext } from "./context"
import { useModalAnimate } from "./internal/use-animate"
import { useModalResizeAndDrag } from "./internal/use-drag"
import { useModalSelect } from "./internal/use-select"
import { useModalSubscriber } from "./internal/use-subscriber"
import { ModalOverlay } from "./overlay"
import type { ModalOverlayOptions, ModalProps } from "./types"

const DragBar = ELECTRON_BUILD ? (
  <span className="drag-region fixed left-0 right-36 top-0 h-8" />
) : null
export const ModalInternal = memo(
  forwardRef<
    HTMLDivElement,
    {
      item: ModalProps & { id: string }
      index: number

      isTop?: boolean
      isBottom?: boolean
      overlayOptions?: ModalOverlayOptions
      onClose?: (open: boolean) => void
    } & PropsWithChildren
  >(function Modal(
    { item, overlayOptions, onClose: onPropsClose, children, isTop, index, isBottom },
    ref,
  ) {
    const {
      CustomModalComponent,
      modalClassName,
      content,
      title,
      clickOutsideToDismiss,
      modalContainerClassName,
      wrapper: Wrapper = Fragment,
      max,
      icon,
      canClose = true,

      draggable = false,
      resizeable = false,
      resizeDefaultSize,
      modal = true,
      autoFocus = true,
    } = item

    const setStack = useSetAtom(modalStackAtom)

    const [currentIsClosing, setCurrentIsClosing] = useState(false)
    const { noticeModal, animateController, dismissing } = useModalAnimate(!!isTop)

    const close = useEventCallback((forceClose = false) => {
      if (!canClose && !forceClose) return
      setCurrentIsClosing(true)

      if (!CustomModalComponent) {
        dismissing().then(() => {
          setStack((p) => p.filter((modal) => modal.id !== item.id))
        })
      } else {
        nextFrame(() => {
          setStack((p) => p.filter((modal) => modal.id !== item.id))
        })
      }
      onPropsClose?.(false)
    })

    const onClose = useCallback(
      (open: boolean): void => {
        if (!open) {
          close()
        }
      },
      [close],
    )

    const opaque = useUISettingKey("modalOpaque")
    const modalSettingOverlay = useUISettingKey("modalOverlay")

    const dismiss = useCallback(
      (e: SyntheticEvent) => {
        e.stopPropagation()

        close(true)
      },
      [close],
    )

    const modalElementRef = useRef<HTMLDivElement>(null)
    const {
      handleDrag,
      handleResizeStart,
      handleResizeStop,
      relocateModal,
      preferDragDir,
      isResizeable,
      resizeableStyle,

      dragController,
    } = useModalResizeAndDrag(modalElementRef, {
      resizeable,
      draggable,
    })

    const getIndex = useEventCallback(() => index)
    const [modalContentRef, setModalContentRef] = useState<HTMLDivElement | null>(null)
    const ModalProps: ModalActionsInternal = useMemo(
      () => ({
        dismiss: close,
        getIndex,
        setClickOutSideToDismiss: (v) => {
          setStack((state) =>
            produce(state, (draft) => {
              const model = draft.find((modal) => modal.id === item.id)
              if (!model) return
              if (model.clickOutsideToDismiss === v) return
              model.clickOutsideToDismiss = v
            }),
          )
        },
      }),
      [close, getIndex, item.id, setStack],
    )
    useModalSubscriber(item.id, ModalProps)

    const ModalContextProps = useMemo<CurrentModalContentProps>(
      () => ({
        ...ModalProps,
        ref: { current: modalContentRef },
      }),
      [ModalProps, modalContentRef],
    )

    const [edgeElementRef, setEdgeElementRef] = useState<HTMLDivElement | null>(null)

    const finalChildren = useMemo(
      () => (
        <AppErrorBoundary errorType={ErrorComponentType.Modal}>
          <RootPortalProvider value={edgeElementRef as HTMLElement}>
            {children ?? createElement(content, ModalProps)}
          </RootPortalProvider>
        </AppErrorBoundary>
      ),
      [ModalProps, children, content, edgeElementRef],
    )

    useEffect(() => {
      if (currentIsClosing) {
        // Radix dialog will block pointer events
        document.body.style.pointerEvents = "auto"
      }
    }, [currentIsClosing])

    useShortcutScope()

    const modalStyle = resizeableStyle
    const { handleSelectStart, handleDetectSelectEnd, isSelectingRef } = useModalSelect()
    const handleClickOutsideToDismiss = useCallback(
      (e: SyntheticEvent) => {
        if (isSelectingRef.current) return
        const fn = modal ? (clickOutsideToDismiss && canClose ? dismiss : noticeModal) : undefined
        fn?.(e)
      },
      [canClose, clickOutsideToDismiss, dismiss, modal, noticeModal, isSelectingRef],
    )

    const openAutoFocus = useCallback(
      (event: Event) => {
        if (!autoFocus) {
          event.preventDefault()
        }
      },
      [autoFocus],
    )

    const measureDragConstraints = useRef((constraints: BoundingBox) => {
      if (getOS() === "Windows") {
        return {
          ...constraints,
          top: constraints.top + ElECTRON_CUSTOM_TITLEBAR_HEIGHT,
        }
      }
      return constraints
    }).current

    useImperativeHandle(ref, () => modalElementRef.current!)
    const currentModalZIndex = MODAL_STACK_Z_INDEX + index * 2

    const Overlay = (
      <ModalOverlay
        zIndex={currentModalZIndex - 1}
        blur={overlayOptions?.blur}
        hidden={
          item.overlay ? currentIsClosing : !(modalSettingOverlay && isBottom) || currentIsClosing
        }
      />
    )

    const mutateableEdgeElementRef = useRefValue(edgeElementRef)

    if (CustomModalComponent) {
      return (
        <Wrapper>
          <Dialog.Root open onOpenChange={onClose} modal={modal}>
            <Dialog.Portal>
              {Overlay}
              <Dialog.DialogTitle className="sr-only">{title}</Dialog.DialogTitle>
              <Dialog.Content
                ref={setModalContentRef}
                asChild
                aria-describedby={undefined}
                onPointerDownOutside={preventDefault}
                onOpenAutoFocus={openAutoFocus}
              >
                <div
                  ref={setEdgeElementRef}
                  className={cn(
                    "no-drag-region fixed",
                    modal ? "inset-0 overflow-auto" : "left-0 top-0",
                    currentIsClosing ? "!pointer-events-none" : "!pointer-events-auto",
                    modalContainerClassName,
                  )}
                  style={{
                    zIndex: currentModalZIndex,
                  }}
                  onPointerUp={handleDetectSelectEnd}
                  onClick={handleClickOutsideToDismiss}
                  onFocus={stopPropagation}
                  tabIndex={-1}
                >
                  {DragBar}
                  <div
                    className={cn("contents", modalClassName)}
                    onClick={stopPropagation}
                    tabIndex={-1}
                    ref={modalElementRef}
                    onSelect={handleSelectStart}
                    onKeyUp={handleDetectSelectEnd}
                  >
                    <ModalContext modalContextProps={ModalContextProps} isTop={!!isTop}>
                      <CustomModalComponent>{finalChildren}</CustomModalComponent>
                    </ModalContext>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </Wrapper>
      )
    }

    const ResizeSwitch = resizeable ? Resizable : SafeFragment

    return (
      <Wrapper>
        <Dialog.Root modal={modal} open onOpenChange={onClose}>
          <Dialog.Portal>
            {Overlay}
            <Dialog.Content
              ref={setModalContentRef}
              asChild
              aria-describedby={undefined}
              onPointerDownOutside={preventDefault}
              onOpenAutoFocus={openAutoFocus}
            >
              <div
                ref={setEdgeElementRef}
                onContextMenu={preventDefault}
                className={cn(
                  "fixed flex",
                  modal ? "inset-0 overflow-auto" : "left-0 top-0",
                  currentIsClosing && "!pointer-events-none",
                  modalContainerClassName,
                  !isResizeable && "center",
                )}
                onFocus={stopPropagation}
                onPointerUp={handleDetectSelectEnd}
                onClick={handleClickOutsideToDismiss}
                style={{
                  zIndex: currentModalZIndex,
                }}
                tabIndex={-1}
              >
                {DragBar}

                <m.div
                  ref={modalElementRef}
                  style={modalStyle}
                  {...modalMontionConfig}
                  animate={animateController}
                  className={cn(
                    "relative flex flex-col overflow-hidden rounded-lg p-2",
                    opaque
                      ? "bg-theme-modal-background-opaque"
                      : "bg-theme-modal-background backdrop-blur-sm",
                    "shadow-modal",
                    max ? "h-[90vh] w-[90vw]" : "max-h-[90vh]",

                    "border border-slate-200 dark:border-neutral-800",
                    modalClassName,
                  )}
                  tabIndex={-1}
                  onClick={stopPropagation}
                  onSelect={handleSelectStart}
                  onKeyUp={handleDetectSelectEnd}
                  drag={draggable && (preferDragDir || draggable)}
                  dragControls={dragController}
                  dragElastic={0}
                  dragListener={false}
                  dragMomentum={false}
                  dragConstraints={mutateableEdgeElementRef}
                  onMeasureDragConstraints={measureDragConstraints}
                  whileDrag={{
                    cursor: "grabbing",
                  }}
                >
                  <ResizeSwitch
                    // enable={resizableOnly("bottomRight")}
                    onResizeStart={handleResizeStart}
                    onResizeStop={handleResizeStop}
                    defaultSize={resizeDefaultSize}
                    className="flex grow flex-col"
                  >
                    <div className={"relative flex items-center"}>
                      <Dialog.Title
                        className="flex w-0 max-w-full grow items-center gap-2 px-4 py-1 text-lg font-semibold"
                        onPointerDownCapture={handleDrag}
                        onPointerDown={relocateModal}
                      >
                        {!!icon && <span className="size-4">{icon}</span>}
                        <EllipsisHorizontalTextWithTooltip className="truncate">
                          <span>{title}</span>
                        </EllipsisHorizontalTextWithTooltip>
                      </Dialog.Title>
                      {canClose && (
                        <Dialog.DialogClose
                          className="center hover:bg-theme-button-hover z-[2] rounded-lg p-2"
                          tabIndex={1}
                          onClick={close}
                        >
                          <i className="i-mgc-close-cute-re" />
                        </Dialog.DialogClose>
                      )}
                    </div>
                    <div className="my-2 h-px w-full shrink-0 bg-slate-200 dark:bg-neutral-800" />

                    <div className="-mx-2 min-h-0 shrink grow overflow-auto px-6 py-2">
                      <ModalContext modalContextProps={ModalContextProps} isTop={!!isTop}>
                        {finalChildren}
                      </ModalContext>
                    </div>
                  </ResizeSwitch>
                </m.div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </Wrapper>
    )
  }),
)

const useShortcutScope = () => {
  const switchHotkeyScope = useSwitchHotKeyScope()
  useEffect(() => {
    switchHotkeyScope("Modal")
    return () => {
      switchHotkeyScope("Home")
    }
  }, [switchHotkeyScope])
}

const ModalContext: FC<
  PropsWithChildren & {
    modalContextProps: CurrentModalContentProps
    isTop: boolean
  }
> = ({ modalContextProps, isTop, children }) => {
  const { getIndex } = modalContextProps
  const zIndex = useAtomValue(
    useMemo(
      () => selectAtom(modalStackAtom, (v) => v.length + MODAL_STACK_Z_INDEX + getIndex() + 1),
      [getIndex],
    ),
  )

  return (
    <CurrentModalContext.Provider value={modalContextProps}>
      <CurrentModalStateContext.Provider
        value={useMemo(
          () => ({
            isTop: !!isTop,
          }),
          [isTop],
        )}
      >
        <ZIndexProvider zIndex={zIndex}>{children}</ZIndexProvider>
      </CurrentModalStateContext.Provider>
    </CurrentModalContext.Provider>
  )
}
