// Glassmorphic Depth Design - Apple-inspired elegant AI sidebar
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
      {/* Multi-layer glass edge with depth */}
      <div className="pointer-events-none fixed right-0 top-0 z-40 h-full">
        {/* Background layer - deepest */}
        <m.div
          className="ai-glass-layer-3 absolute right-0 top-0 h-full"
          style={{
            width: intensity > 0.1 ? 1 + intensity * 3 : 0,
            opacity: intensity * 0.15,
            background: "linear-gradient(to left, rgba(255, 92, 0, 0.15), transparent)",
            transform: `translateX(${intensity * -8}px)`,
          }}
        />

        {/* Middle layer */}
        <m.div
          className="ai-glass-layer-2 absolute right-0 top-0 h-full"
          style={{
            width: intensity > 0.2 ? 1.5 + intensity * 4 : 0,
            opacity: intensity * 0.25,
            background: "linear-gradient(to left, rgba(255, 92, 0, 0.2), transparent)",
            transform: `translateX(${intensity * -4}px)`,
            boxShadow:
              intensity > 0.3
                ? `0 0 ${12 + intensity * 20}px rgba(255, 92, 0, ${intensity * 0.15})`
                : "none",
          }}
        />

        {/* Front layer - most prominent */}
        <m.div
          className="ai-glass-layer-1 absolute right-0 top-0 h-full"
          style={{
            width: intensity > 0 ? 2 + intensity * 6 : 1,
            opacity: intensity * 0.6,
            background: `linear-gradient(to left,
              rgba(255, 92, 0, ${intensity * 0.4}),
              rgba(255, 140, 0, ${intensity * 0.2}),
              transparent)`,
            boxShadow:
              intensity > 0.5
                ? `0 0 ${16 + intensity * 24}px rgba(255, 92, 0, ${intensity * 0.25})`
                : "none",
          }}
        />

        {/* Subtle ambient glow */}
        {intensity > 0.4 && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-0 top-1/2 size-32 -translate-y-1/2"
            style={{
              opacity: (intensity - 0.4) * 0.3,
              background: `radial-gradient(ellipse at center,
                rgba(255, 92, 0, ${(intensity - 0.4) * 0.12}) 0%,
                transparent 70%)`,
              filter: "blur(30px)",
              transform: `translateY(-50%) translateX(${intensity * -20}px)`,
            }}
          />
        )}
      </div>

      <AnimatePresence>
        {showPrompt && (
          <m.div
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.95 }}
            transition={Spring.presets.smooth}
            className="fixed bottom-12 right-6 z-50 flex flex-col items-end gap-3"
            style={{
              transform: `translateX(${intensity * -3}px)`,
            }}
          >
            {/* Unified glass card with integrated button */}
            <m.div
              className="ai-glass-card relative"
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={Spring.presets.snappy}
            >
              {/* Main unified card */}
              <div
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br to-background/95 backdrop-blur-2xl"
                style={{
                  backgroundImage:
                    "linear-gradient(to bottom right, rgba(var(--color-background) / 0.98), rgba(var(--color-background) / 0.95))",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "rgba(255, 92, 0, 0.2)",
                  boxShadow:
                    "0 8px 32px rgba(255, 92, 0, 0.08), 0 4px 16px rgba(255, 92, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.1)",
                }}
              >
                {/* Inner glow */}
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background:
                      "linear-gradient(to bottom right, rgba(255, 92, 0, 0.05), transparent, rgba(255, 92, 0, 0.05))",
                  }}
                />

                {/* Info section */}
                <div className="relative px-5 py-3.5 text-right">
                  <p className="text-sm font-medium text-text">Ask AI anything</p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    Get insights about this article
                  </p>
                </div>

                {/* Divider */}
                <div
                  className="mx-4 h-px"
                  style={{
                    background:
                      "linear-gradient(to right, transparent, rgba(255, 92, 0, 0.2), transparent)",
                  }}
                />

                {/* Button section */}
                <button
                  type="button"
                  className="group relative w-full px-5 py-3 text-left transition-all duration-300"
                  onClick={onExpand}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(to right, rgba(255, 92, 0, 0.08), rgba(255, 140, 0, 0.05))"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent"
                  }}
                >
                  {/* Subtle shine effect on hover */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-gray/5 to-transparent transition-transform duration-700 group-hover:translate-x-full dark:via-white/5" />

                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {/* Minimal indicator dot */}
                      <m.div
                        className="size-2 rounded-full"
                        style={{ backgroundColor: "#FF5C00" }}
                        animate={{
                          opacity: [0.6, 1, 0.6],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        }}
                      />
                      <span className="text-sm font-medium text-text">Open AI Chat</span>
                    </div>

                    <KbdCombined
                      abbr="Open AI Chat"
                      joint
                      className="rounded-md bg-fill/40 px-2 backdrop-blur-sm"
                    >
                      {toggleAIChatShortcut}
                    </KbdCombined>
                  </div>
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  )
}

export const AISmartSidebar: React.FC = () =>
  !useAIPanelVisibility() && <AIAmbientSidebar onExpand={() => setAIPanelVisibility(true)} />
