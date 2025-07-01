import type { UIMessage } from "@ai-sdk/ui-utils"
import { parseMarkdown } from "@follow/components/utils/parse-markdown.js"
import * as React from "react"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AIChatMessageProps {
  message: UIMessage
}

export const AIChatMessage: React.FC<AIChatMessageProps> = ({ message }) => {
  const markdownElement = React.useMemo(
    () => parseMarkdown(message.content).content,
    [message.content],
  )

  return (
    <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} group`}>
      <div
        className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-sm ${
          message.role === "user"
            ? "from-orange bg-gradient-to-r to-red-500 text-white"
            : "bg-background border-fill-secondary border"
        }`}
      >
        {message.role === "assistant" && (
          <div className="mb-3 flex items-center gap-3">
            <div className="from-orange flex size-6 items-center justify-center rounded-full bg-gradient-to-r to-red-500 shadow-sm">
              <i className="i-mgc-ai-cute-re size-3 text-white" />
            </div>
            <span className="text-text-secondary text-xs font-medium">{APP_NAME} AI</span>
          </div>
        )}
        <div className={`text-[0.95rem] ${message.role === "user" ? "text-white" : "text-text"}`}>
          {markdownElement}
        </div>
        <div
          className={`mt-3 text-xs ${message.role === "user" ? "text-white/70" : "text-text-tertiary"}`}
        >
          {message.createdAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  )
}

// Typing indicator component
export const AIChatTypingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start">
      <div className="bg-fill-secondary max-w-[85%] rounded-2xl px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="from-orange flex size-5 items-center justify-center rounded-full bg-gradient-to-r to-red-500">
            <i className="i-mgc-ai-cute-re size-3 text-white" />
          </div>
          <span className="text-text-secondary text-xs font-medium">{APP_NAME} AI</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="bg-text-tertiary size-2 animate-bounce rounded-full [animation-delay:-0.3s]" />
          <div className="bg-text-tertiary size-2 animate-bounce rounded-full [animation-delay:-0.15s]" />
          <div className="bg-text-tertiary size-2 animate-bounce rounded-full" />
        </div>
      </div>
    </div>
  )
}
