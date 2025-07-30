import { useGlobalFocusableScopeSelector } from "@follow/components/common/Focusable/hooks.js"
import { Spring } from "@follow/components/constants/spring.js"
import { useMousePosition } from "@follow/components/hooks/useMouse.js"
import { cn, combineCleanupFunctions } from "@follow/utils"
import { EventBus } from "@follow/utils/event-bus"
import { AnimatePresence, m } from "motion/react"
import type { FC } from "react"
import * as React from "react"
import { useEffect, useState } from "react"
import { create } from "zustand"

import { getAIChatPinned, setAIChatPinned, useAIChatPinned } from "~/atoms/settings/ai"
import { Focusable, FocusablePresets } from "~/components/common/Focusable"
import { HotkeyScope } from "~/constants"
import { AIChatContext, useAIChatStore } from "~/modules/ai/chat/__internal__/AIChatContext"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { useCommandBinding } from "~/modules/command/hooks/use-command-binding"

import { AIChatContainer } from "./AIChatContainer"
import { AIPanelHeader } from "./AIPanelHeader"
import type { IEntryAIContext } from "./context"
import { EntryAIContext, useEntryAIContextStore } from "./context"

const AIChat: React.FC = () => {
  const { sendMessage } = React.use(AIChatContext)
  const handleSendMessage = React.useCallback(
    (message: string) => {
      sendMessage({
        text: message,
        metadata: {
          finishTime: new Date().toISOString(),
        },
      })
    },
    [sendMessage],
  )

  const store = useEntryAIContextStore()()

  // const setContextInfo = useAIChatStore((s) => s.setContextInfo)
  const useAiContextStore = useAIChatStore()
  useEffect(() => {
    const aiContextStore = useAiContextStore.getState()
    aiContextStore.setEntryId(store.entryId ?? undefined)
    aiContextStore.setSelectedText(store.selectedText ?? undefined)
  }, [store.entryId, store.selectedText, useAiContextStore])

  return <AIChatContainer onSendMessage={handleSendMessage} />
}

const AIAmbientSidebar: React.FC<{ onExpand: () => void }> = ({ onExpand }) => {
  const [intensity, setIntensity] = useState(0)
  const [showPrompt, setShowPrompt] = useState(false)

  const isShowPromptRef = React.useRef(false)

  const mousePosition = useMousePosition()

  // Calculate the distance between the mouse and the right edge of the screen
  useEffect(() => {
    const rightEdgeDistance = window.innerWidth - mousePosition.x
    const maxDistance = 500 // Maximum sensing distance
    const threshold = 80 // Threshold distance for showing prompt
    const showedThreshold = 300
    const topBoundary = 100 // Top boundary to avoid toolbar area

    // Don't trigger if mouse is in the toolbar area (top 100px)
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
      const showPrompt = rightEdgeDistance <= threshold
      setShowPrompt(showPrompt)
      isShowPromptRef.current = showPrompt
    } else {
      setIntensity(0)
      setShowPrompt(false)
      isShowPromptRef.current = false
    }
  }, [mousePosition])

  const selectedText = useEntryAIContextStore()((s) => s.selectedText)

  return (
    <>
      {/* Blurred gradient bar - Adheres to the right edge */}
      <m.div
        className="pointer-events-none fixed right-0 top-0 z-40 h-full w-2"
        animate={{
          opacity: intensity * 0.8,
          width: intensity > 0 ? 8 + intensity * 40 : 2,
          // Breathing effect - Starts breathing when intensity is greater than 0.3
          scale: intensity > 0.3 ? [1, 1.1, 1] : 1,
        }}
        transition={{
          duration: 0.3,
          ease: "easeOut",
          // Breathing animation configuration
          scale: {
            repeat: intensity > 0.3 ? Infinity : 0,
            duration: 2,
            ease: "easeInOut",
          },
        }}
        style={{
          background: `linear-gradient(to left, 
            rgba(255, 92, 0, ${intensity * 0.4}) 0%, 
            rgba(255, 140, 0, ${intensity * 0.3}) 50%, 
            transparent 100%)`,
          transformOrigin: "right center",
        }}
      />

      <AnimatePresence>
        {showPrompt && (
          <>
            <m.div
              className="pointer-events-none fixed bottom-12 right-0 z-40"
              initial={{ opacity: 0, scale: 0.5, x: 0 }}
              animate={{
                opacity: intensity * 0.6,
                scale: 0.5 + intensity * 1.5,
                x: intensity > 0 ? -10 - intensity * 30 : 0,
              }}
              transition={Spring.presets.smooth}
              exit={{
                opacity: 0,
                scale: 0.5,
                x: 0,
              }}
              style={{
                width: 100,
                height: 100,
                background: `radial-gradient(circle, 
                rgba(255, 92, 0, ${intensity * 0.3}) 0%, 
                rgba(255, 140, 0, ${intensity * 0.2}) 40%, 
                transparent 70%)`,
              }}
            />
            <m.div
              className="fixed bottom-12 right-6 z-50 flex flex-col items-end gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={Spring.presets.smooth}
            >
              {/* Text prompt */}
              <m.div className="bg-background/90 border-folo/30 rounded-2xl border px-4 py-3 backdrop-blur-xl">
                <div className="text-right">
                  <p className="text-text text-sm font-medium">
                    {selectedText ? "Ask AI about selection" : "Ask AI anything"}
                  </p>
                  <p className="text-text-secondary mt-1 text-xs">
                    {selectedText
                      ? `"${selectedText.slice(0, 30)}..."`
                      : "Get insights about this article"}
                  </p>
                </div>
              </m.div>

              {/* Clickable area */}
              <m.button
                className="border-folo/40 from-folo/20 hover:from-folo/30 rounded-full border bg-gradient-to-r to-red-500/20 px-6 py-2 backdrop-blur-xl transition-all duration-300 hover:to-red-500/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onExpand}
              >
                <div className="flex items-center gap-2">
                  <m.div
                    className="from-folo size-2 rounded-full bg-gradient-to-r to-red-500"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "easeInOut",
                    }}
                  />
                  <span className="text-text text-sm font-medium">Open AI Chat</span>
                </div>
              </m.button>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// AI Chat Panel Component - Expanded chat panel
const AIChatSidePanel: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <m.div
    className="bg-background/95 border-border fixed inset-y-0 right-0 z-50 flex w-96 flex-col border-l shadow-2xl backdrop-blur-xl"
    initial={{ x: "100%" }}
    animate={{ x: 0 }}
    exit={{ x: "100%" }}
    transition={{ type: "spring", damping: 25, stiffness: 200 }}
  >
    {/* Panel header */}
    <AIPanelHeader onClose={onClose} />

    {/* AI Chat content */}
    <div className="flex min-h-[500px] grow flex-col">
      <Focusable scope={HotkeyScope.AIChat} asChild>
        <AIChat />
      </Focusable>
    </div>
  </m.div>
)

const useCreateEntryAIContext = (entryId: string) => {
  const ctxStore = React.useMemo(() => {
    return create<IEntryAIContext>(() => ({
      entryId,
      selectedText: "",
    }))
  }, [entryId])
  // Listen for text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection()

      if (
        selection?.anchorNode?.firstChild?.nodeName === "INPUT" ||
        selection?.anchorNode?.firstChild?.nodeName === "TEXTAREA"
      ) {
        return
      }

      const text = selection?.toString().trim()

      if (text)
        ctxStore.setState({
          selectedText: text || "",
        })
    }

    document.addEventListener("selectionchange", handleSelection)
    return () => document.removeEventListener("selectionchange", handleSelection)
  }, [ctxStore])

  return ctxStore
}
// eslint-disable-next-line unicorn/no-thenable
const infiniteThenable = { then() {} }
export const AISmartSidebar = ({ entryId }: { entryId: string }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const hasAi = React.use(AIChatContext)
  if (!hasAi) {
    throw infiniteThenable
  }

  const ctxStore = useCreateEntryAIContext(entryId)

  const when = useGlobalFocusableScopeSelector(FocusablePresets.isNotFloatingLayerScope)
  useCommandBinding({
    commandId: COMMAND_ID.global.toggleAIChat,
    when,
  })

  useCommandBinding({
    commandId: COMMAND_ID.global.toggleAIChatPinned,
    when,
  })

  useEffect(() => {
    return combineCleanupFunctions(
      EventBus.subscribe(COMMAND_ID.global.toggleAIChat, () => {
        setIsExpanded((state) => !state)
      }),
      EventBus.subscribe(COMMAND_ID.global.toggleAIChatPinned, () => {
        const current = getAIChatPinned()
        setIsExpanded(false)
        setAIChatPinned(!current)
      }),
    )
  }, [])

  if (useAIChatPinned()) return null

  return (
    <EntryAIContext value={ctxStore}>
      {!isExpanded && <AIAmbientSidebar onExpand={() => setIsExpanded(true)} />}
      <AnimatePresence>
        {isExpanded && <AIChatSidePanel onClose={() => setIsExpanded(false)} />}
      </AnimatePresence>
    </EntryAIContext>
  )
}

export const AIChatPanelContainer: FC<{
  className?: string
  entryId: string
  onClose: () => void
}> = React.memo(({ className, entryId, onClose }) => {
  const ctxStore = useCreateEntryAIContext(entryId)

  return (
    <EntryAIContext value={ctxStore}>
      <Focusable
        scope={HotkeyScope.AIChat}
        className={cn("bg-background relative flex grow flex-col overflow-hidden", className)}
      >
        {/* Panel header */}
        <AIPanelHeader onClose={onClose} />

        {/* AI Chat content */}
        <div className="relative flex grow flex-col overflow-hidden">
          <AIChat />
        </div>
      </Focusable>
    </EntryAIContext>
  )
})
