import type { PopoverContentProps } from "@radix-ui/react-popover"
import { atom } from "jotai"
import type { ReactNode } from "react"

import { createAtomHooks, jotaiStore } from "~/lib/jotai"

// Atom

export interface PopoverProps extends Omit<PopoverContentProps, "children"> {
  /** Custom z-index for popover */
  zIndex?: number
  /** Whether the popover should close when clicked outside */
  modal?: boolean
}

type PopoverState =
  | { open: false }
  | {
      open: true
      position: { x: number; y: number }
      content: ReactNode
      props?: PopoverProps
      // Just for abort callback
      abortController: AbortController
    }

export const [popoverAtom, usePopoverState, usePopoverValue, useSetPopover] = createAtomHooks(
  atom<PopoverState>({ open: false }),
)

export const showPopover = (
  mouseXY: { x: number; y: number },
  element: ReactNode,
  props?: PopoverProps,
) => {
  jotaiStore.set(popoverAtom, {
    open: true,
    position: mouseXY,
    content: element,
    props,
    abortController: new AbortController(),
  })
}
