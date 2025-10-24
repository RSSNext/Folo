import { RootPortalContext } from "@follow/components/ui/portal/provider.js"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/index.js"
import { ZIndexProvider } from "@follow/components/ui/z-index/index.js"
import { useRefValue } from "@follow/hooks"
import { ELECTRON_BUILD } from "@follow/shared/constants"
import { preventDefault, stopPropagation } from "@follow/utils/dom"
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
import { Focusable } from "~/components/common/Focusable"
import { SafeFragment } from "~/components/common/Fragment"
import { m } from "~/components/common/Motion"
import { ErrorComponentType } from "~/components/errors/enum"
import { ElECTRON_CUSTOM_TITLEBAR_HEIGHT, HotkeyScope } from "~/constants"

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
export const ModalInternal = memo(function Modal({
  ref,
  item,
  overlayOptions,
  onClose: onPropsClose,
  children,
  isTop,
  index,
  isBottom,
}: {
  item: ModalProps & { id: string }
  index: number

  isTop?: boolean
  isBottom?: boolean
  overlayOptions?: ModalOverlayOptions
  onClose?: (open: boolean) => void
} & PropsWithChildren & { ref?: React.Ref<HTMLDivElement | null> }) {
  const {
    CustomModalComponent,
    content,
    title,
    clickOutsideToDismiss,

    modalClassName,
    modalContainerClassName,
    modalContentClassName,

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

  // Animation controls
  const { animateController, playNoticeAnimation, playExitAnimation, isClosing, readyToClose } =
    useModalAnimate(!!isTop, item.id)

  // Simple dismiss logic
  const close = useEventCallback(async (forceClose = false) => {
    if (!canClose && !forceClose) return
    readyToClose()
    try {
      if (CustomModalComponent) {
        // Custom modals handle their own animation
        setStack((p) => p.filter((modal) => modal.id !== item.id))
      } else {
        // Play exit animation then remove from stack\
        await playExitAnimation()
        setStack((p) => p.filter((modal) => modal.id !== item.id))
      }
    } catch (error) {
      // If animation fails, still remove from stack
      console.warn("Modal animation failed:", error)
      setStack((p) => p.filter((modal) => modal.id !== item.id))
    }

    item.onClose?.()
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

  const modalSettingOverlay = useUISettingKey("modalOverlay")

  const dismiss = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation()
      close(true)
    },
    [close],
  )

  const modalElementRef = useRef<HTMLDivElement | null>(null)
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
      modalElementRef,
    }),
    [ModalProps, modalContentRef],
  )

  const [edgeElementRef, setEdgeElementRef] = useState<HTMLDivElement | null>(null)

  const finalChildren = useMemo(
    () => (
      <AppErrorBoundary errorType={ErrorComponentType.Modal}>
        <RootPortalContext value={edgeElementRef as HTMLElement}>
          {children ?? createElement(content, ModalProps)}
        </RootPortalContext>
      </AppErrorBoundary>
    ),
    [ModalProps, children, content, edgeElementRef],
  )

  useEffect(() => {
    if (isClosing) {
      // Radix dialog will block pointer events
      document.body.style.pointerEvents = "auto"
    }
  }, [isClosing])

  const modalStyle = resizeableStyle
  const { handleSelectStart, handleDetectSelectEnd, isSelectingRef } = useModalSelect()
  const handleClickOutsideToDismiss = useCallback(
    (e: SyntheticEvent) => {
      if (isSelectingRef.current) return

      if (modal && clickOutsideToDismiss && canClose) {
        dismiss(e)
      } else if (modal) {
        playNoticeAnimation()
      }
    },
    [canClose, clickOutsideToDismiss, dismiss, modal, playNoticeAnimation, isSelectingRef],
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
      hidden={item.overlay ? isClosing : !(modalSettingOverlay && isBottom) || isClosing}
    />
  )

  const mutateableEdgeElementRef = useRefValue(edgeElementRef)

  if (CustomModalComponent) {
    return (
      <Wrapper>
        <Dialog.Root open onOpenChange={onClose} modal={modal}>
          <Dialog.Portal>
            {Overlay}
            <Dialog.Content
              ref={setModalContentRef}
              asChild
              aria-describedby={undefined}
              onPointerDownOutside={preventDefault}
              onOpenAutoFocus={openAutoFocus}
            >
              <Focusable
                scope={HotkeyScope.Modal}
                ref={setEdgeElementRef}
                className={cn(
                  "no-drag-region fixed",
                  modal ? "inset-0 overflow-auto" : "left-0 top-0",
                  isClosing ? "!pointer-events-none" : "!pointer-events-auto",
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
                <Dialog.DialogTitle className="sr-only">{title}</Dialog.DialogTitle>
                {DragBar}
                <div
                  className={cn("contents", modalClassName, modalContentClassName)}
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
              </Focusable>
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
            <Focusable
              scope={HotkeyScope.Modal}
              ref={setEdgeElementRef}
              onContextMenu={preventDefault}
              className={cn(
                "fixed flex",
                modal ? "inset-0 overflow-auto" : "left-0 top-0",
                isClosing && "!pointer-events-none",
                modalContainerClassName,
                !isResizeable && "center",
              )}
              onFocus={stopPropagation}
              onPointerUp={handleDetectSelectEnd}
              onClick={handleClickOutsideToDismiss}
              style={{
                zIndex: currentModalZIndex,
                perspective: 1200,
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
                  "relative flex flex-col overflow-hidden rounded-xl px-2 pt-1",
                  "bg-background",
                  "shadow-modal [transform-style:preserve-3d]",
                  max ? "h-[90vh] w-[90vw]" : "max-h-[90vh]",
                  "border border-border",
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
                  <div className={"relative z-10 flex flex-col bg-background"}>
                    <div className={"flex items-center"}>
                      <Dialog.Title
                        className="flex w-0 max-w-full grow items-center gap-2 px-2 pb-1 pt-2 text-base font-medium text-text"
                        onPointerDownCapture={handleDrag}
                        onPointerDown={relocateModal}
                      >
                        {!!icon && <span className="center flex size-4">{icon}</span>}
                        <EllipsisHorizontalTextWithTooltip className="truncate">
                          <span>{title}</span>
                        </EllipsisHorizontalTextWithTooltip>
                      </Dialog.Title>
                      {canClose && (
                        <Dialog.DialogClose
                          className="center z-[2] -mr-1 rounded-lg p-2 text-text-secondary hover:bg-fill-quaternary hover:text-text"
                          tabIndex={1}
                          onClick={close}
                        >
                          <i className="i-mgc-close-cute-re" />
                        </Dialog.DialogClose>
                      )}
                    </div>

                    {(title || icon || canClose) && (
                      <div className="mx-1 mt-1 h-px shrink-0 bg-border" />
                    )}
                  </div>

                  <div
                    className={cn(
                      "-mx-2 min-h-0 shrink grow overflow-auto overflow-x-hidden px-4 pb-4 pt-3 text-sm text-text",
                      modalContentClassName,
                    )}
                  >
                    <ModalContext modalContextProps={ModalContextProps} isTop={!!isTop}>
                      {finalChildren}
                    </ModalContext>
                  </div>
                </ResizeSwitch>
              </m.div>
            </Focusable>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Wrapper>
  )
})

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
    <CurrentModalContext value={modalContextProps}>
      {/* eslint-disable-next-line @eslint-react/no-context-provider */}
      <CurrentModalStateContext.Provider
        value={useMemo(
          () => ({
            isTop: !!isTop,
            isInModal: true,
          }),
          [isTop],
        )}
      >
        <ZIndexProvider zIndex={zIndex}>{children}</ZIndexProvider>
      </CurrentModalStateContext.Provider>
    </CurrentModalContext>
  )
}
