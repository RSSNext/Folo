import { useInputComposition } from "@follow/hooks"
import { cn, stopPropagation } from "@follow/utils"
import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"
import { memo, use, useCallback, useState } from "react"

import { AIChatContext, AIPanelRefsContext } from "~/modules/ai/chat/__internal__/AIChatContext"
import { AIChatContextBar } from "~/modules/ai/chat/components/AIChatContextBar"
import { AIChatSendButton } from "~/modules/ai/chat/components/AIChatSendButton"

import { CollapsibleError } from "./CollapsibleError"

const chatInputVariants = cva(
  [
    "bg-background/60 focus-within:ring-accent/20 focus-within:border-accent/80 border-border/80",
    "relative overflow-hidden rounded-2xl border backdrop-blur-xl duration-200 focus-within:ring-2",
  ],
  {
    variants: {
      variant: {
        default: "shadow-2xl shadow-black/5 dark:shadow-zinc-800",
        minimal: "shadow shadow-zinc-100 dark:shadow-black/5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

interface ChatInputProps extends VariantProps<typeof chatInputVariants> {
  onSend: (message: string) => void
}

export const ChatInput = memo(({ onSend, variant }: ChatInputProps) => {
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
  const inputProps = useInputComposition<HTMLTextAreaElement>({
    onKeyDown: handleKeyPress,
  })

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIsEmpty(e.target.value.trim() === "")
  }, [])

  return (
    <div className="w-full">
      {/* Error Display */}
      {error && <CollapsibleError error={error} />}

      {/* Integrated Input Container with Context Bar */}
      <div className={cn(chatInputVariants({ variant }))}>
        {/* Input Area */}
        <div className="relative z-10 flex items-end">
          <textarea
            onContextMenu={stopPropagation}
            ref={inputRef}
            onChange={handleChange}
            {...inputProps}
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
          <AIChatContextBar
            className="border-0 bg-transparent px-4 py-2.5"
            onSendShortcut={onSend}
          />
        </div>
      </div>
    </div>
  )
})

ChatInput.displayName = "ChatInput"
