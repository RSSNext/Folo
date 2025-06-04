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

import { usePopoverState } from "~/atoms/popover"
import { HotkeyScope } from "~/constants"

export const PopoverProvider: Component = ({ children }) => (
  <>
    {children}
    <Handler />
  </>
)

const Handler = memo(() => {
  const ref = useRef<HTMLButtonElement>(null)
  const [popoverState, setPopoverState] = usePopoverState()
  const setGlobalFocusableScope = useSetGlobalFocusableScope()

  useEffect(() => {
    if (!popoverState.open) return
    const triggerElement = ref.current
    if (!triggerElement) return

    triggerElement.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      }),
    )
  }, [popoverState])

  return (
    <Popover
      onOpenChange={(state) => {
        if (state) {
          setGlobalFocusableScope(HotkeyScope.DropdownMenu, "append")
        } else {
          setGlobalFocusableScope(HotkeyScope.DropdownMenu, "remove")
          setPopoverState({ open: false })
        }
      }}
    >
      <PopoverTrigger
        ref={ref}
        className="pointer-events-none"
        style={
          popoverState.open
            ? { position: "fixed", top: popoverState.position.y, left: popoverState.position.x }
            : {}
        }
      />
      <PopoverContent asChild forceMount>
        <AnimatePresence>
          {popoverState.open && (
            <m.div
              className="bg-material-ultra-thick backdrop-blur-background mr-2 rounded-xl border p-2 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={Spring.presets.smooth}
            >
              <PopoverArrow className="fill-border" />
              {popoverState.content}
            </m.div>
          )}
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  )
})

Handler.displayName = "PopoverHandler"
