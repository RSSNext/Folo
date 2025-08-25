import { Spring } from "@follow/components/constants/spring.js"
import { cn } from "@follow/utils"
import { AnimatePresence, m } from "motion/react"
import type { FC } from "react"

import {
  AIChatPanelStyle,
  setAIPanelVisibility,
  useAIChatPanelStyle,
  useAIPanelVisibility,
} from "~/atoms/settings/ai"
import { AISpline } from "~/modules/ai-chat/components/3d-models/AISpline"

export interface AISplineButtonProps {
  className?: string
}

export const AISplineButton: FC<AISplineButtonProps> = ({ className }) => {
  const panelStyle = useAIChatPanelStyle()
  const isVisible = useAIPanelVisibility()

  // Only show the spline button when:
  // 1. Panel style is floating
  // 2. Panel is currently not visible
  const shouldShow = panelStyle === AIChatPanelStyle.Floating && !isVisible

  const handleClick = () => {
    setAIPanelVisibility(true)
  }

  return (
    <AnimatePresence>
      {shouldShow && (
        <m.button
          key="ai-spline-button"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={Spring.presets.smooth}
          onClick={handleClick}
          className={cn(
            "fixed bottom-8 right-8 z-40",
            "size-16 rounded-2xl",
            "backdrop-blur-xl",
            "hover:scale-105",
            "active:scale-95",
            "flex items-center justify-center",
            "transition-all duration-300 ease-out",
            className,
          )}
          title="Open AI Chat"
        >
          <AISpline />
        </m.button>
      )}
    </AnimatePresence>
  )
}
