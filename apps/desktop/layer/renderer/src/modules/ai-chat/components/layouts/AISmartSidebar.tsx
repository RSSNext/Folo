// Glassmorphic Depth Design - Apple-inspired elegant AI sidebar
import "./AISmartSidebar.css"

import { useGlobalFocusableScopeSelector } from "@follow/components/common/Focusable/hooks.js"
import { Spring } from "@follow/components/constants/spring.js"
import { KbdCombined } from "@follow/components/ui/kbd/Kbd.js"
import { AnimatePresence, m, useSpring, useTransform } from "motion/react"
import * as React from "react"
import { useEffect, useState } from "react"

import { setAIPanelVisibility, useAIPanelVisibility } from "~/atoms/settings/ai"
import { FocusablePresets } from "~/components/common/Focusable"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { useCommandShortcut } from "~/modules/command/hooks/use-command-binding"

const AIAmbientSidebar: React.FC<{ onExpand: () => void }> = ({ onExpand }) => {
  const [showPrompt, setShowPrompt] = useState(false)
  const isShowPromptRef = React.useRef(false)
  const intensity = useSpring(0, Spring.presets.smooth)

  const layer3Width = useTransform(intensity, (value) => (value > 0.1 ? 1 + value * 3 : 0))
  const layer3Opacity = useTransform(intensity, (value) => value * 0.15)
  const layer3X = useTransform(intensity, (value) => value * -8)

  const layer2Width = useTransform(intensity, (value) => (value > 0.2 ? 1.5 + value * 4 : 0))
  const layer2Opacity = useTransform(intensity, (value) => value * 0.25)
  const layer2BoxShadow = useTransform(intensity, (value) =>
    value > 0.3 ? `0 0 ${12 + value * 20}px rgba(255, 92, 0, ${value * 0.15})` : "none",
  )
  const layer2X = useTransform(intensity, (value) => value * -4)

  const layer1Width = useTransform(intensity, (value) => (value > 0 ? 2 + value * 6 : 1))
  const layer1Opacity = useTransform(intensity, (value) => value * 0.6)
  const layer1BoxShadow = useTransform(intensity, (value) =>
    value > 0.5 ? `0 0 ${16 + value * 24}px rgba(255, 92, 0, ${value * 0.25})` : "none",
  )
  const layer1Background = useTransform(intensity, (value) => {
    const primaryAlpha = Math.min(1, Math.max(0, value * 0.4))
    const secondaryAlpha = Math.min(1, Math.max(0, value * 0.2))
    return `linear-gradient(to left, rgba(255, 92, 0, ${primaryAlpha}), rgba(255, 140, 0, ${secondaryAlpha}), transparent)`
  })

  const glowOpacity = useTransform(intensity, (value) => (value <= 0.4 ? 0 : (value - 0.4) * 0.3))
  const glowBackground = useTransform(intensity, (value) => {
    const alpha = value <= 0.4 ? 0 : (value - 0.4) * 0.12
    return `radial-gradient(ellipse at center, rgba(255, 92, 0, ${alpha}) 0%, transparent 70%)`
  })
  const glowX = useTransform(intensity, (value) => value * -20)

  const canShowPrompt = useGlobalFocusableScopeSelector(FocusablePresets.isNotFloatingLayerScope)
  useEffect(() => {
    if (!canShowPrompt) {
      intensity.set(0)
      if (isShowPromptRef.current) {
        isShowPromptRef.current = false
        setShowPrompt(false)
      }
      return
    }

    const maxDistance = 500
    const threshold = 80
    const showedThreshold = 300
    const topBoundary = 100
    const frameRef = { current: null as number | null }

    const hidePrompt = () => {
      intensity.set(0)
      if (isShowPromptRef.current) {
        isShowPromptRef.current = false
        setShowPrompt(false)
      }
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }

      const { clientX, clientY } = event
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null

        const rightEdgeDistance = window.innerWidth - clientX

        if (clientY <= topBoundary) {
          hidePrompt()
          return
        }

        if (rightEdgeDistance <= maxDistance) {
          const newIntensity = Math.max(0, (maxDistance - rightEdgeDistance) / maxDistance)
          intensity.set(newIntensity)

          if (isShowPromptRef.current && rightEdgeDistance <= showedThreshold) {
            return
          }

          const shouldShow = rightEdgeDistance <= threshold
          if (shouldShow !== isShowPromptRef.current) {
            isShowPromptRef.current = shouldShow
            setShowPrompt(shouldShow)
          }
        } else {
          hidePrompt()
        }
      })
    }

    const handlePointerLeave = () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      hidePrompt()
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    window.addEventListener("pointerleave", handlePointerLeave)

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerleave", handlePointerLeave)
    }
  }, [canShowPrompt, intensity])

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
            width: layer3Width,
            opacity: layer3Opacity,
            background: "linear-gradient(to left, rgba(255, 92, 0, 0.15), transparent)",
            x: layer3X,
          }}
        />

        {/* Middle layer */}
        <m.div
          className="ai-glass-layer-2 absolute right-0 top-0 h-full"
          style={{
            width: layer2Width,
            opacity: layer2Opacity,
            background: "linear-gradient(to left, rgba(255, 92, 0, 0.2), transparent)",
            x: layer2X,
            boxShadow: layer2BoxShadow,
          }}
        />

        {/* Front layer - most prominent */}
        <m.div
          className="ai-glass-layer-1 absolute right-0 top-0 h-full"
          style={{
            width: layer1Width,
            opacity: layer1Opacity,
            background: layer1Background,
            boxShadow: layer1BoxShadow,
          }}
        />

        {/* Subtle ambient glow */}
        <m.div
          className="absolute right-0 top-1/2 size-32 -translate-y-1/2"
          style={{
            opacity: glowOpacity,
            background: glowBackground,
            filter: "blur(30px)",
            x: glowX,
          }}
        />
      </div>

      <AnimatePresence>
        {showPrompt && (
          <m.div
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.95 }}
            transition={Spring.presets.smooth}
            className="fixed bottom-12 right-6 z-50 flex flex-col items-end gap-3"
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
