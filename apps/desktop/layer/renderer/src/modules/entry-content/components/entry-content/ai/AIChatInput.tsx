import { cn } from "@follow/utils"
import * as React from "react"

import { AIChatContext } from "~/modules/ai/chat/__internal__/AIChatContext"

interface AIChatInputProps {
  value?: string
  onChange?: (value: string) => void
  onSend: (message: string) => void
  placeholder?: string
  disabled?: boolean
  inputRef: React.RefObject<HTMLTextAreaElement>
}

const minHeight = 32
const maxHeight = 120

export const AIChatInput: React.FC<AIChatInputProps> = ({
  value,
  onChange,
  inputRef: textareaRef,
  onSend,
  placeholder = "Ask me anything about your feeds, or describe a task...",
  disabled = false,
}) => {
  const [height, setHeight] = React.useState(minHeight)
  const [isEmpty, setIsEmpty] = React.useState(true)

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    if (textareaRef.current) {
      onSend(textareaRef.current.value)
      onChange?.("")
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
  }, [])

  // Auto-resize when value changes
  React.useEffect(() => {
    autoResize()
  }, [value, autoResize])

  React.useEffect(() => {
    if (textareaRef.current) {
      autoResize()
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value)
    setTimeout(autoResize, 0)
    setIsEmpty(e.target.value.trim() === "")
  }

  const { status } = React.use(AIChatContext)

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        className="bg-background scrollbar-none border-border placeholder:text-text-tertiary focus:border-accent w-full resize-none rounded-lg border px-4 py-3 pr-12 text-sm shadow-sm outline-none transition-all focus:shadow-md disabled:opacity-50"
        style={{
          height: `${height}px`,
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`,
        }}
      />

      {/* Action buttons inside input */}
      <div className="absolute right-2 top-2 flex items-center gap-2">
        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || isEmpty || status === "streaming"}
          className={cn(
            "from-orange hover:from-orange/90 disabled:bg-control-disabled flex size-8 items-center justify-center rounded-lg bg-gradient-to-r to-red-500 transition-all hover:to-red-500/90 disabled:opacity-50",
          )}
        >
          <i className="i-mgc-send-plane-cute-fi size-4 text-white" />
        </button>
      </div>
    </div>
  )
}
