import { useGlobalFocusableScopeSelector } from "@follow/components/common/Focusable/hooks.js"
import { use, useCallback, useEffect, useState } from "react"

import { FocusablePresets } from "~/components/common/Focusable"
import { AIChatContext, AIPanelRefsContext } from "~/modules/ai/chat/__internal__/AIChatContext"
import { AIChatContextBar } from "~/modules/ai/chat/AIChatContextBar"
import { AIChatSendButton } from "~/modules/ai/chat/AIChatSendButton"

interface ChatInputProps {
  onSend: (message: string) => void
}

export const ChatInput = ({ onSend }: ChatInputProps) => {
  const { inputRef } = use(AIPanelRefsContext)
  const { status, stop, error } = use(AIChatContext)
  const [isEmpty, setIsEmpty] = useState(true)

  const isProcessing = status === "submitted" || status === "streaming"

  const handleSend = useCallback(() => {
    if (inputRef.current && inputRef.current.value.trim()) {
      const message = inputRef.current.value.trim()
      onSend(message)
      inputRef.current.value = ""
      setIsEmpty(true)
    }
  }, [onSend, inputRef])

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        if (isProcessing) {
          stop?.()
        } else {
          handleSend()
        }
      }
    },
    [handleSend, isProcessing, stop],
  )

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIsEmpty(e.target.value.trim() === "")
  }, [])

  const hasFocus = useGlobalFocusableScopeSelector(FocusablePresets.isAIChat)
  useEffect(() => {
    const handler = () => {
      if (hasFocus) {
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handler)
    return () => {
      window.removeEventListener("keydown", handler)
    }
  }, [hasFocus, inputRef])

  return (
    <div className="absolute inset-x-0 bottom-0">
      <div className="mx-auto max-w-4xl p-6">
        {/* Error Display - Floating glass morphism style */}
        {error && (
          <div className="animate-in slide-in-from-bottom-2 fade-in-0 mb-3 duration-300">
            <div className="bg-red/10 border-red/20 shadow-red/5 dark:shadow-red/10 relative overflow-hidden rounded-xl border shadow-lg backdrop-blur-2xl">
              {/* Glass effect overlay */}
              <div className="from-red/5 absolute inset-0 bg-gradient-to-r to-transparent" />

              {/* Content */}
              <div className="relative z-10 flex items-start gap-3 p-4">
                <div className="bg-red/20 flex size-8 flex-shrink-0 items-center justify-center rounded-full">
                  <i className="i-mgc-alert-cute-fi text-red size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-red text-sm font-medium">Error occurred</div>
                  <div className="text-red/80 mt-1 text-xs leading-relaxed">{error.message}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Integrated Input Container with Context Bar */}
        <div className="bg-background/60 focus-within:ring-accent/20 focus-within:border-accent/80 border-border/80 relative overflow-hidden rounded-2xl border shadow-2xl shadow-black/5 backdrop-blur-xl duration-200 focus-within:ring-2 dark:shadow-zinc-800">
          {/* Input Area */}
          <div className="relative z-10 flex items-end">
            <textarea
              ref={inputRef}
              onChange={handleChange}
              onKeyDown={handleKeyPress}
              placeholder="Message AI assistant..."
              className="scrollbar-none text-text placeholder:text-text-secondary max-h-40 min-h-14 w-full resize-none bg-transparent px-5 py-3.5 pr-14 text-sm !outline-none transition-all duration-200"
              rows={1}
              autoFocus
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AIChatSendButton
                onClick={isProcessing ? stop : handleSend}
                disabled={!isProcessing && isEmpty}
                isProcessing={isProcessing}
                size="sm"
              />
            </div>
          </div>

          {/* Context Bar - Always shown, positioned below the input area */}
          <div className="border-border/20 relative z-10 border-t bg-transparent">
            <AIChatContextBar className="border-0 bg-transparent px-4 py-2.5" />
          </div>
        </div>
      </div>
    </div>
  )
}
