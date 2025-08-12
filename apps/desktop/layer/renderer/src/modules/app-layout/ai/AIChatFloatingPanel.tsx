import { Spring } from "@follow/components/constants/spring.js"
import { cn, computeAdjustedTopLeftPosition } from "@follow/utils"
import { m } from "motion/react"
import type { ResizeDirection } from "re-resizable"
import { Resizable } from "re-resizable"
import type { FC } from "react"
import { useEffect, useRef } from "react"

import {
  getFloatingPanelState,
  setFloatingPanelState,
  useFloatingPanelState,
} from "~/atoms/settings/ai"
import { Focusable } from "~/components/common/Focusable"
import { HotkeyScope } from "~/constants"
import { ChatHeader } from "~/modules/ai-chat/components/layouts/ChatHeader"
import { ChatInterface } from "~/modules/ai-chat/components/layouts/ChatInterface"

export interface AIChatFloatingPanelProps
  extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {}

export const AIChatFloatingPanel: FC<AIChatFloatingPanelProps> = ({ className, ...props }) => {
  const floatingState = useFloatingPanelState()

  // Preserve right/bottom margins to keep panel anchored to bottom-right on window resize
  const rightBottomMarginRef = useRef({ right: 0, bottom: 0 })
  useEffect(() => {
    rightBottomMarginRef.current = {
      right: Math.max(0, window.innerWidth - (floatingState.x + floatingState.width)),
      bottom: Math.max(0, window.innerHeight - (floatingState.y + floatingState.height)),
    }
  }, [floatingState.x, floatingState.y, floatingState.width, floatingState.height])

  const handleResize = useRef(
    (_event: MouseEvent | TouchEvent, direction: ResizeDirection, ref: HTMLElement) => {
      const prev = getFloatingPanelState()
      const newWidth = ref.offsetWidth
      const newHeight = ref.offsetHeight
      const { x, y } = computeAdjustedTopLeftPosition(
        { x: prev.x, y: prev.y, width: prev.width, height: prev.height },
        { width: newWidth, height: newHeight },
        direction,
      )

      setFloatingPanelState({ width: newWidth, height: newHeight, x, y })
    },
  ).current

  // Keep floating panel anchored to bottom-right on window resize
  useEffect(() => {
    const handleWindowResize = () => {
      const { right, bottom } = rightBottomMarginRef.current
      const newX = Math.max(0, window.innerWidth - floatingState.width - right)
      const newY = Math.max(0, window.innerHeight - floatingState.height - bottom)
      setFloatingPanelState({ x: newX, y: newY })
    }

    window.addEventListener("resize", handleWindowResize)
    return () => window.removeEventListener("resize", handleWindowResize)
  }, [floatingState.width, floatingState.height])

  const chatContent = (
    <Focusable
      scope={HotkeyScope.AIChat}
      className={cn(
        "bg-background relative flex h-full flex-col overflow-hidden rounded-lg border shadow-xl",
        className,
      )}
      {...props}
    >
      <ChatHeader />
      <ChatInterface />
    </Focusable>
  )

  return (
    <m.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={Spring.presets.smooth}
      className="fixed z-50"
      style={{ left: floatingState.x, top: floatingState.y }}
    >
      <div className="relative">
        <Resizable
          size={{ width: floatingState.width, height: floatingState.height }}
          onResize={handleResize}
          onResizeStop={handleResize}
          minWidth={500}
          minHeight={600}
          maxWidth={600}
          maxHeight={Math.floor(window.innerHeight * 0.85)}
          enable={{
            top: true,
            right: true,
            bottom: true,
            left: true,
            topRight: true,
            bottomRight: true,
            bottomLeft: true,
            topLeft: true,
          }}
        >
          {chatContent}
        </Resizable>
      </div>
    </m.div>
  )
}
