import type { UIMessage } from "@ai-sdk/ui-utils"
import { parseMarkdown } from "@follow/components/utils/parse-markdown.js"
import { m } from "motion/react"
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
  const nextMessageContent = React.useMemo(() => {
    if (message.role === "assistant" && !message.content) {
      return "AI is thinking..."
    }
    return message.content
  }, [message])

  const markdownElement = React.useMemo(
    () => parseMarkdown(nextMessageContent).content,
    [nextMessageContent],
  )

  return (
    <m.div
      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} group`}
      initial={{
        opacity: 0,
        y: 20,
        scale: 0.95,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: message.role === "user" ? 0.1 : 0.2,
      }}
    >
      <div
        className={`max-w-[calc(100%-1rem)] rounded-xl px-3 py-2.5 backdrop-blur-sm ${
          message.role === "user"
            ? "border border-blue-400/20 bg-gradient-to-br from-blue-500/90 to-blue-600/95 text-white shadow-lg shadow-blue-500/20"
            : "text-text border border-gray-200/60 bg-gradient-to-br from-white/80 to-gray-50/90 shadow-lg shadow-black/5 dark:border-zinc-700/60 dark:from-zinc-800/80 dark:to-zinc-900/90 dark:shadow-black/20"
        }`}
      >
        {message.role === "assistant" && (
          <div className="mb-2 flex items-center gap-2">
            <div className="from-orange flex size-5 items-center justify-center rounded-full bg-gradient-to-r to-red-500 shadow-sm">
              <i className="i-mgc-ai-cute-re size-3 text-white" />
            </div>
            <span className="text-text-secondary text-xs font-medium">{APP_NAME} AI</span>
          </div>
        )}
        <div
          className={`select-text text-[0.95rem] ${
            message.role === "user" ? "text-white" : "text-text"
          }`}
        >
          {markdownElement}
        </div>
        <div
          className={`mt-2 text-xs ${message.role === "user" ? "text-white/70" : "text-text-tertiary"}`}
        >
          {message.createdAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </m.div>
  )
}

// Typing indicator component
export const AIChatTypingIndicator: React.FC = () => {
  return (
    <m.div
      className="flex justify-start"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="max-w-[70%] rounded-xl border border-gray-200/60 bg-gradient-to-br from-white/80 to-gray-50/90 px-3 py-2.5 shadow-lg shadow-black/5 backdrop-blur-sm dark:border-zinc-700/60 dark:from-zinc-800/80 dark:to-zinc-900/90 dark:shadow-black/20">
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
    </m.div>
  )
}
