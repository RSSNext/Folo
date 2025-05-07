import { cn } from "@follow/utils/utils"
import { useStore } from "jotai"
import type { FC, PropsWithChildren, ReactNode, RefObject } from "react"
import * as React from "react"
import { useEffect, useImperativeHandle, useMemo, useState } from "react"
import { Drawer } from "vaul"

import { RootPortalContext } from "../portal/provider"
import { SheetContext, sheetStackAtom } from "./context"

export interface PresentSheetProps {
  content: ReactNode | FC
  open?: boolean
  onOpenChange?: (value: boolean) => void
  title?: ReactNode
  hideHeader?: boolean
  zIndex?: number
  dismissible?: boolean
  defaultOpen?: boolean

  triggerAsChild?: boolean
  contentRef?: RefObject<HTMLDivElement | null>
  dismissableClassName?: string
  modalClassName?: string
  contentClassName?: string
}

export type SheetRef = {
  dismiss: () => Promise<void>
}
const MODAL_STACK_Z_INDEX = 1001
export const PresentSheet = ({
  ref,
  ...props
}: PropsWithChildren<PresentSheetProps> & { ref?: React.Ref<SheetRef | null> }) => {
  const {
    content,
    children,
    zIndex = MODAL_STACK_Z_INDEX,
    title,
    hideHeader,
    dismissible = true,
    defaultOpen,
    triggerAsChild,
    contentRef,
    dismissableClassName,
    modalClassName,
    contentClassName,
  } = props

  const [isOpen, setIsOpen] = useState(props.open ?? defaultOpen)

  useImperativeHandle(ref, () => ({
    dismiss: () => {
      return new Promise<void>((resolve) => {
        setIsOpen(false)
        setTimeout(() => {
          resolve()
        }, 500)
      })
    },
  }))

  const nextRootProps = useMemo(() => {
    const nextProps = {
      onOpenChange: setIsOpen,
    } as any
    if (isOpen !== undefined) {
      nextProps.open = isOpen
    }

    if (props.onOpenChange !== undefined) {
      nextProps.onOpenChange = (v: boolean) => {
        setIsOpen(v)
        props.onOpenChange?.(v)
      }
    }

    return nextProps
  }, [props, isOpen, setIsOpen])

  useEffect(() => {
    if (props.open !== undefined) {
      setIsOpen(props.open)
    }
  }, [props.open])
  const [holderRef, setHolderRef] = useState<HTMLDivElement | null>()
  const store = useStore()

  useEffect(() => {
    const holder = holderRef
    if (!holder) return
    store.set(sheetStackAtom, (p) => p.concat(holder))

    return () => {
      store.set(sheetStackAtom, (p) => p.filter((item) => item !== holder))
    }
  }, [holderRef, store])

  const overlayZIndex = zIndex - 1
  const contentZIndex = zIndex

  const contentInnerRef = React.useRef<HTMLDivElement>(null)
  useImperativeHandle(contentRef, () => contentInnerRef.current!)

  return (
    <Drawer.Root dismissible={dismissible} repositionInputs={false} {...nextRootProps}>
      {!!children && <Drawer.Trigger asChild={triggerAsChild}>{children}</Drawer.Trigger>}
      <Drawer.Portal>
        <Drawer.Content
          ref={contentInnerRef}
          style={{
            zIndex: contentZIndex,
          }}
          aria-describedby={undefined}
          className={cn(
            "bg-theme-background fixed inset-x-0 bottom-0 flex max-h-[calc(100svh-3rem)] flex-col rounded-t-[10px] border-t pt-4",
            modalClassName,
          )}
        >
          {dismissible && (
            <div
              className={cn(
                "mx-auto mb-8 h-1.5 w-12 shrink-0 rounded-full bg-zinc-300 dark:bg-neutral-800",
                dismissableClassName,
              )}
            />
          )}

          {title ? (
            <Drawer.Title
              className={cn(
                "-mt-4 mb-4 flex justify-center px-4 text-lg font-medium",
                hideHeader && "sr-only",
              )}
            >
              {title}
            </Drawer.Title>
          ) : (
            <Drawer.Title />
          )}

          <SheetContext
            value={useMemo(
              () => ({
                dismiss() {
                  setIsOpen(false)
                },
              }),
              [setIsOpen],
            )}
          >
            <RootPortalContext value={contentInnerRef.current!}>
              <div
                className={cn(
                  "pb-safe-offset-4 flex grow flex-col overflow-auto px-4",
                  contentClassName,
                )}
              >
                {typeof content === "function" ? React.createElement(content) : content}
              </div>
            </RootPortalContext>
          </SheetContext>
          <div ref={setHolderRef} />
        </Drawer.Content>
        <Drawer.Overlay
          className="fixed inset-0 bg-neutral-800/40"
          style={{
            zIndex: overlayZIndex,
          }}
        />
      </Drawer.Portal>
    </Drawer.Root>
  )
}
