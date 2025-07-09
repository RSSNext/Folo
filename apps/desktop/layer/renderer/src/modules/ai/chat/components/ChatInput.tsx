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
  const { status, stop } = use(AIChatContext)
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
