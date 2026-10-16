import { useSetGlobalFocusableScope } from "@follow/components/common/Focusable/hooks.js"
import type { PointerEvent as ReactPointerEvent } from "react"
import { useCallback, useEffect, useRef, useState } from "react"

import { HotkeyScope } from "~/constants"

/** How the popover was opened: resting the pointer on it, or a click or key press. */
type OpenedBy = "hover" | "press"

/**
 * State for a Radix popover that also opens while the pointer rests on its trigger, as a hover
 * card does, but stays usable from the keyboard. Opened with a click or a key it takes the focus,
 * keeps its controls in the tab order, closes with Escape and gives the focus back to the
 * trigger. Opened by hovering it leaves the focus alone and closes when the pointer leaves.
 */
export const useHoverPopover = ({ openDelay = 100, closeDelay = 300 } = {}) => {
  const [openedBy, setOpenedBy] = useState<OpenedBy | null>(null)
  const open = openedBy !== null
  const openedByRef = useRef<OpenedBy | null>(null)
  // Still read once the popover has closed, to decide where the focus goes
  const lastOpenedByRef = useRef<OpenedBy>("press")
  const focusEnteredRef = useRef(false)
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const clearTimers = useCallback(() => {
    clearTimeout(openTimerRef.current)
    clearTimeout(closeTimerRef.current)
  }, [])
  useEffect(() => clearTimers, [clearTimers])

  const update = useCallback((next: OpenedBy | null) => {
    openedByRef.current = next
    if (next) lastOpenedByRef.current = next
    setOpenedBy(next)
  }, [])
  const show = useCallback(
    (by: OpenedBy = "press") => {
      clearTimers()
      if (openedByRef.current === null) focusEnteredRef.current = false
      // A click on a popover opened by hovering keeps it open after the pointer leaves
      update(openedByRef.current === "press" ? "press" : by)
    },
    [clearTimers, update],
  )
  const hide = useCallback(() => {
    clearTimers()
    update(null)
  }, [clearTimers, update])

  const onPointerEnter = useCallback(
    (event: ReactPointerEvent) => {
      if (event.pointerType === "touch") return
      clearTimeout(closeTimerRef.current)
      if (openedByRef.current) return
      clearTimeout(openTimerRef.current)
      openTimerRef.current = setTimeout(() => show("hover"), openDelay)
    },
    [openDelay, show],
  )
  const onPointerLeave = useCallback(
    (event: ReactPointerEvent) => {
      if (event.pointerType === "touch") return
      clearTimeout(openTimerRef.current)
      if (openedByRef.current !== "hover") return
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = setTimeout(hide, closeDelay)
    },
    [closeDelay, hide],
  )

  // Opened with a click or a key, the focus is in the popover: the app's single-key shortcuts
  // stand down, so Space, Tab and the arrow keys work its controls
  const setGlobalFocusableScope = useSetGlobalFocusableScope()
  const takesFocus = openedBy === "press"
  useEffect(() => {
    if (!takesFocus) return
    setGlobalFocusableScope(HotkeyScope.DropdownMenu, "append")
    return () => {
      setGlobalFocusableScope(HotkeyScope.DropdownMenu, "remove")
    }
  }, [setGlobalFocusableScope, takesFocus])

  return {
    open,
    show,
    hide,
    onOpenChange: useCallback((next: boolean) => (next ? show() : hide()), [hide, show]),
    triggerProps: { onPointerEnter, onPointerLeave },
    contentProps: {
      onPointerEnter,
      onPointerLeave,
      onFocus: () => {
        focusEnteredRef.current = true
      },
      onOpenAutoFocus: (event: Event) => {
        if (lastOpenedByRef.current === "hover") event.preventDefault()
      },
      // Back to the trigger, unless the popover only showed on hover and the focus never left
      // where it was
      onCloseAutoFocus: (event: Event) => {
        if (lastOpenedByRef.current === "hover" && !focusEnteredRef.current) event.preventDefault()
      },
    },
  }
}
