import { cn } from "@follow/utils"
import * as React from "react"

import { AIChatContext, AIPanelRefsContext } from "~/modules/ai/chat/__internal__/AIChatContext"
import { AIChatSendButton } from "~/modules/ai/chat/components/AIChatSendButton"

interface AIChatInputProps {
  value?: string
  onChange?: (value: string) => void
  onSend: (message: string) => void
  placeholder?: string
  disabled?: boolean
}

const minHeight = 120
const maxHeight = 200

export const AIChatInput = ({
  value,
  onChange,
  onSend,
  placeholder = "Ask me anything about your feeds, or describe a task...",
  disabled = false,
}: AIChatInputProps) => {
  const { inputRef: textareaRef } = React.use(AIPanelRefsContext)
  const [height, setHeight] = React.useState(minHeight)
  const [isEmpty, setIsEmpty] = React.useState(true)

  const { status, stop } = React.use(AIChatContext)

  // Determine if we should show stop button
  const isProcessing = status === "submitted" || status === "streaming"

  const handleSend = () => {
    if (textareaRef.current && textareaRef.current.value.trim()) {
      const message = textareaRef.current.value.trim()

      onSend(message)
      setIsEmpty(true)

      requestAnimationFrame(() => {
        textareaRef.current?.focus()
      })
    }
  }

  const handleButtonClick = () => {
    if (isProcessing) {
      // Stop the AI processing
      stop?.()
    } else {
      // Send the message
      handleSend()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleButtonClick()
    }
  }

  // Auto-resize function
  const autoResize = React.useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      const { scrollHeight } = textareaRef.current
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)
      setHeight(newHeight)
      textareaRef.current.style.height = `${newHeight}px`
    }
  }, [textareaRef])

  // Auto-resize when value changes
  React.useEffect(() => {
    autoResize()
  }, [value, autoResize])

  React.useEffect(() => {
    if (textareaRef.current) {
      autoResize()
      textareaRef.current.focus()
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value)
    setTimeout(autoResize, 0)
    setIsEmpty(e.target.value.trim() === "")
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        onFocus={() => {
          setIsEmpty(!textareaRef.current?.value)
        }}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "scrollbar-none placeholder:text-text-tertiary w-full resize-none border-0 bg-transparent text-sm outline-none transition-all disabled:opacity-50",
          "px-4 py-3 pr-12",
        )}
        style={{
          height: `${height}px`,
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`,
        }}
      />

      {/* Action buttons inside input */}
      <div className="absolute right-3 top-3 flex items-center gap-2">
        {/* Send/Stop button */}
        <AIChatSendButton
          onClick={handleButtonClick}
          disabled={disabled || (!isProcessing && isEmpty)}
          isProcessing={isProcessing}
          size="sm"
        />
      </div>
    </div>
  )
}
