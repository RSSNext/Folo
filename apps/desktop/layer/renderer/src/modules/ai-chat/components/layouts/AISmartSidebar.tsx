// Replaced motion/react animations with CSS animations
import "./AISmartSidebar.css"

import { Spring } from "@follow/components/constants/spring.js"
import { useMousePosition } from "@follow/components/hooks/useMouse.js"
import { AnimatePresence, m } from "motion/react"
import * as React from "react"
import { useEffect, useState } from "react"

import { setAIPanelVisibility, useAIPanelVisibility } from "~/atoms/settings/ai"

const AIAmbientSidebar: React.FC<{ onExpand: () => void }> = ({ onExpand }) => {
  const [intensity, setIntensity] = useState(0)
  const [showPrompt, setShowPrompt] = useState(false)
  const isShowPromptRef = React.useRef(false)
  const mousePosition = useMousePosition()

  useEffect(() => {
    const rightEdgeDistance = window.innerWidth - mousePosition.x
    const maxDistance = 500
    const threshold = 80
    const showedThreshold = 300
    const topBoundary = 100

    if (mousePosition.y <= topBoundary) {
      setIntensity(0)
      setShowPrompt(false)
      isShowPromptRef.current = false
      return
    }

    if (isShowPromptRef.current && rightEdgeDistance <= showedThreshold) {
      return
    }

    if (rightEdgeDistance <= maxDistance) {
      const newIntensity = Math.max(0, (maxDistance - rightEdgeDistance) / maxDistance)
      setIntensity(newIntensity)
      const shouldShow = rightEdgeDistance <= threshold
      setShowPrompt(shouldShow)
      isShowPromptRef.current = shouldShow
    } else {
      setIntensity(0)
      setShowPrompt(false)
      isShowPromptRef.current = false
    }
  }, [mousePosition])

  return (
    <>
      <div
        className={`ai-ambient-bar pointer-events-none fixed right-0 top-0 z-40 h-full w-2 ${
          intensity > 0.3 ? "ai-ambient-pulse" : ""
        }`}
        style={{
          opacity: intensity * 0.8,
          width: intensity > 0 ? 8 + intensity * 40 : 2,
          background: `linear-gradient(to left, rgba(255, 92, 0, ${intensity * 0.4}) 0%, rgba(255, 140, 0, ${intensity * 0.3}) 50%, transparent 100%)`,
        }}
      />

      <AnimatePresence>
        {showPrompt && (
          <>
            <m.div
              initial={{ opacity: 0, scale: 0.5, x: 0 }}
              animate={{
                opacity: intensity * 0.6,
                scale: 0.5 + intensity * 1.5,
                x: intensity > 0 ? -10 - intensity * 30 : 0,
              }}
              exit={{ opacity: 0, scale: 0.5, x: 0 }}
              transition={Spring.presets.smooth}
              className="ai-glow-blob pointer-events-none fixed bottom-12 right-0 z-40"
              style={{
                opacity: intensity * 0.6,
                transform: `translateX(${intensity > 0 ? -10 - intensity * 30 : 0}px) scale(${0.5 + intensity * 1.5})`,
                width: 100,
                height: 100,
                background: `radial-gradient(circle, rgba(255, 92, 0, ${intensity * 0.3}) 0%, rgba(255, 140, 0, ${intensity * 0.2}) 40%, transparent 70%)`,
              }}
            />
            <m.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="ai-prompt-container ai-prompt-visible fixed bottom-12 right-6 z-50 flex flex-col items-end gap-3"
            >
              <div className="bg-background/90 border-folo/30 rounded-2xl border px-4 py-3 backdrop-blur-xl">
                <div className="text-right">
                  <p className="text-text text-sm font-medium">Ask AI anything</p>
                  <p className="text-text-secondary mt-1 text-xs">
                    Get insights about this article
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="border-folo/40 from-folo/20 hover:from-folo/30 rounded-full border bg-gradient-to-r to-red-500/20 px-6 py-2 backdrop-blur-xl transition-all duration-300 hover:to-red-500/30"
                onClick={onExpand}
              >
                <div className="flex items-center gap-2">
                  <div className="from-folo ai-dot-pulse size-2 rounded-full bg-gradient-to-r to-red-500" />
                  <span className="text-text text-sm font-medium">Open AI Chat</span>
                </div>
              </button>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export const AISmartSidebar: React.FC = () =>
  !useAIPanelVisibility() && <AIAmbientSidebar onExpand={() => setAIPanelVisibility(true)} />
