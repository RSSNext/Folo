import { cn } from "@follow/utils"
import * as React from "react"

interface AIReasoningPartProps {
  text: string
  isStreaming?: boolean
  className?: string
}

export const AIReasoningPart: React.FC<AIReasoningPartProps> = React.memo(({ text, className }) => {
  if (!text) return null

  return (
    <div className={cn("min-w-0 max-w-full text-left", className)}>
      <div className="w-[calc(var(--ai-chat-message-container-width,65ch))] max-w-full" />
      <div className="text-xs">
        <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-material-medium p-3 text-[11px] leading-relaxed text-text-secondary">
          {text}
        </pre>
      </div>
    </div>
  )
})

AIReasoningPart.displayName = "AIReasoningPart"
