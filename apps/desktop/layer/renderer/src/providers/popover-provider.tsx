// Import from the correct path
import { useSetGlobalFocusableScope } from "@follow/components/common/Focusable/hooks.js"
import { Spring } from "@follow/components/constants/spring.js"
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@follow/components/ui/popover/index.jsx"
import { AnimatePresence, m } from "motion/react"
import { memo, useEffect, useRef } from "react"

import { dismissPopover, usePopoverValue } from "~/atoms/popover"
import { HotkeyScope } from "~/constants"

export const PopoverProvider: Component = ({ children }) => (
  <>
    {children}
    <Handler />
  </>
)

const Handler = memo(() => {
  const popoverState = usePopoverValue()
  const setGlobalFocusableScope = useSetGlobalFocusableScope()

  useEffect(() => {
    if (!popoverState.open) return

    setGlobalFocusableScope(HotkeyScope.DropdownMenu, "append")
    return () => {
      setGlobalFocusableScope(HotkeyScope.DropdownMenu, "remove")
    }
  }, [popoverState.open, setGlobalFocusableScope])

  // Kept after the state closed: the content gives the focus back when it unmounts
  const openerRef = useRef<HTMLElement | null>(null)
  const interactedOutsideRef = useRef(false)
  useEffect(() => {
    if (!popoverState.open) return
    openerRef.current = popoverState.opener
    interactedOutsideRef.current = false
  }, [popoverState])

  const { modal, zIndex, ...contentProps } = popoverState.open ? (popoverState.props ?? {}) : {}

  return (
    <Popover
      open={popoverState.open}
      modal={modal}
      onOpenChange={(state) => {
        if (!state) {
          dismissPopover()
        }
      }}
    >
      {/* Only anchors the popover at the pointer. It stays out of the page flow while closed too:
          as an inline button after the full-height layout it made the page taller than the window,
          so focusing it on close or opening a modal scrolled the whole app up. */}
      <PopoverTrigger
        className="pointer-events-none size-0"
        style={{
          position: "fixed",
          top: popoverState.open ? popoverState.position.y : 0,
          left: popoverState.open ? popoverState.position.x : 0,
        }}
      />
      <AnimatePresence>
        {popoverState.open && (
          <PopoverContent
            {...contentProps}
            asChild
            forceMount
            style={{ ...contentProps.style, zIndex }}
            onInteractOutside={(event) => {
              contentProps.onInteractOutside?.(event)
              interactedOutsideRef.current = true
            }}
            onCloseAutoFocus={(event) => {
              contentProps.onCloseAutoFocus?.(event)
              if (event.defaultPrevented) return
              // The trigger is only an invisible anchor at the pointer, so the focus goes back to
              // the element the popover was opened from, unless the user moved on elsewhere
              event.preventDefault()
              const opener = openerRef.current
              openerRef.current = null
              if (!interactedOutsideRef.current && opener?.isConnected) {
                opener.focus()
              }
            }}
          >
            <m.div
              className="mr-2 rounded-xl border bg-material-ultra-thick p-2 shadow-2xl backdrop-blur-background"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={Spring.presets.smooth}
            >
              <PopoverArrow className="fill-border" />
              {popoverState.content}
            </m.div>
          </PopoverContent>
        )}
      </AnimatePresence>
    </Popover>
  )
})

Handler.displayName = "PopoverHandler"
