// Replaced motion/react animations with CSS animations
import "./AISmartSidebar.css"

import { useGlobalFocusableScopeSelector } from "@follow/components/common/Focusable/hooks.js"
import { Spring } from "@follow/components/constants/spring.js"
import { useMousePosition } from "@follow/components/hooks/useMouse.js"
import { KbdCombined } from "@follow/components/ui/kbd/Kbd.js"
import { AnimatePresence, m } from "motion/react"
import * as React from "react"
import { useEffect, useState } from "react"

import { setAIPanelVisibility, useAIPanelVisibility } from "~/atoms/settings/ai"
import { FocusablePresets } from "~/components/common/Focusable"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { useCommandShortcut } from "~/modules/command/hooks/use-command-binding"

const AIAmbientSidebar: React.FC<{ onExpand: () => void }> = ({ onExpand }) => {
  const [intensity, setIntensity] = useState(0)
  const [showPrompt, setShowPrompt] = useState(false)
  const isShowPromptRef = React.useRef(false)
  const mousePosition = useMousePosition()

  const canShowPrompt = useGlobalFocusableScopeSelector(FocusablePresets.isNotFloatingLayerScope)
  useEffect(() => {
    if (!canShowPrompt) return
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
  }, [canShowPrompt, mousePosition])

  const toggleAIChatShortcut = useCommandShortcut(COMMAND_ID.global.toggleAIChat)
  if (!canShowPrompt) return null
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
              <div className="rounded-2xl border border-folo/30 bg-background/90 px-4 py-3 backdrop-blur-xl">
                <div className="text-right">
                  <p className="text-sm font-medium text-text">Ask AI anything</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    Get insights about this article
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="rounded-full border border-folo/40 bg-gradient-to-r from-folo/20 to-red-500/20 px-6 py-2 backdrop-blur-xl transition-all duration-300 hover:from-folo/30 hover:to-red-500/30"
                onClick={onExpand}
              >
                <div className="flex items-center gap-2">
                  <div className="ai-dot-pulse size-2 rounded-full bg-gradient-to-r from-folo to-red-500" />
                  <span className="text-sm font-medium text-text">Open AI Chat</span>
                  <KbdCombined abbr="Open AI Chat" joint className="rounded-full px-2">
                    {toggleAIChatShortcut}
                  </KbdCombined>
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
