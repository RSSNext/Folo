import { Spring } from "@follow/components/constants/spring.js"
import { clsx } from "@follow/utils"
import { AnimatePresence, m } from "motion/react"
import type { FC } from "react"

import { setAIPanelVisibility, useAIPanelVisibility, useAISettingKey } from "~/atoms/settings/ai"
import { AISpline } from "~/modules/ai-chat/components/3d-models/AISpline"
import { AISmartSidebar } from "~/modules/ai-chat/components/layouts/AISmartSidebar"

export const AIIndicator: FC = () => {
  const isVisible = useAIPanelVisibility()
  const showSplineButton = useAISettingKey("showSplineButton")

  // Only show the spline button when:
  // 1. Panel style is floating
  // 2. Panel is currently not visible
  const shouldShow = !isVisible

  const handleClick = () => {
    setAIPanelVisibility(true)
  }

  return (
    <AnimatePresence>
      {shouldShow && !showSplineButton && <AISmartSidebar />}
      {shouldShow && showSplineButton && (
        <m.button
          key="ai-spline-button"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={Spring.presets.smooth}
          onClick={handleClick}
          className={clsx(
            "fixed bottom-8 right-8 z-40",
            "rounded-2xl",
            "hover:scale-105",
            "active:scale-95",
            "flex items-center justify-center",
            "transition-all duration-300 ease-out",
          )}
          title="Open AI Chat"
        >
          <AISpline />
        </m.button>
      )}
    </AnimatePresence>
  )
}
