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
      setStack((p) => p.filter((modal) => modal.id !== item.id))
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
    if (currentIsClosing) {
      // Radix dialog will block pointer events
      document.body.style.pointerEvents = "auto"
    }
  }, [currentIsClosing])

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
              <Focusable
                scope={HotkeyScope.Modal}
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
                  "relative flex flex-col overflow-hidden rounded-lg px-2 pt-2",
                  "bg-background",
                  "shadow-modal",
                  max ? "h-[90vh] w-[90vw]" : "max-h-[90vh]",

                  "border-border border",
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
                      className="flex w-0 max-w-full grow items-center gap-2 px-2 py-1 text-lg font-semibold"
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
                        className="center hover:bg-material-ultra-thick z-[2] rounded-lg p-2"
                        tabIndex={1}
                        onClick={close}
                      >
                        <i className="i-mgc-close-cute-re" />
                      </Dialog.DialogClose>
                    )}
                  </div>
                  <div className="bg-border mx-1 mt-2 h-px shrink-0" />

                  <div
                    className={cn(
                      "-mx-2 min-h-0 shrink grow overflow-auto p-4",
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
