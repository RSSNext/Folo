import { Spring } from "@follow/components/constants/spring.js"
import { AnimatePresence } from "motion/react"
import { useCallback, useEffect } from "react"
import { useTranslation } from "react-i18next"

import { m } from "~/components/common/Motion"

import { setScrollToExitTutorialSeen, useScrollToExitTutorialSeen } from "../atoms/tutorial"

// Simplified and clearer scroll gesture icon
const ScrollGestureIcon = () => (
  <m.svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-text-secondary"
  >
    {/* Mouse/trackpad outline */}
    <rect
      x="12"
      y="8"
      width="16"
      height="24"
      rx="8"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      opacity="0.5"
    />

    {/* Animated scroll wheel/finger moving up */}
    <m.rect
      width="4"
      height="6"
      rx="2"
      fill="currentColor"
      style={{ x: 18 }}
      initial={{ y: 20 }}
      animate={{ y: 14 }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
      }}
    />

    {/* Clear upward arrows */}
    <m.path
      d="M20 6L16 10L17.5 10L20 7.5L22.5 10L24 10L20 6Z"
      fill="currentColor"
      initial={{ opacity: 0.3, y: -3 }}
      animate={{ opacity: 1, y: -6 }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
      }}
    />

    {/* Second arrow for emphasis */}
    <m.path
      d="M20 2L16 6L17.5 6L20 3.5L22.5 6L24 6L20 2Z"
      fill="currentColor"
      initial={{ opacity: 0.2, y: 0 }}
      animate={{ opacity: 0.8, y: -3 }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
        delay: 0.2,
      }}
    />
  </m.svg>
)

interface ScrollToExitTutorialProps {
  /** Whether to show the tutorial */
  show: boolean
  /** Optional callback when tutorial is dismissed */
  onDismiss?: () => void
}

export const ScrollToExitTutorial = ({ show, onDismiss }: ScrollToExitTutorialProps) => {
  const { t } = useTranslation()
  const hasSeenTutorial = useScrollToExitTutorialSeen()
  const isVisible = show && !hasSeenTutorial

  const handleDismiss = useCallback(() => {
    setScrollToExitTutorialSeen(true)
    onDismiss?.()
  }, [onDismiss])

  // Handle Escape key to dismiss
  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isVisible, handleDismiss])

  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          initial={{ opacity: 0, y: -10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          transition={Spring.presets.snappy}
          className="center absolute top-12 z-[102] w-full"
          onClick={handleDismiss}
        >
          <div className="w-fit">
            <div className="bg-background border-fill-secondary relative cursor-pointer rounded-xl border px-6 py-4 shadow-lg backdrop-blur-md transition-transform hover:scale-105">
              <div className="flex items-center gap-4">
                <ScrollGestureIcon />
                <div className="flex flex-col gap-1.5">
                  <div className="text-text text-base">
                    {t("tutorial.scroll_to_exit.title")}
                    <div className="text-text-secondary text-sm">
                      {t("tutorial.scroll_to_exit.description")}
                    </div>
                    <div className="text-text-tertiary mt-1 text-xs">
                      {t("tutorial.scroll_to_exit.dismiss_hint")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
