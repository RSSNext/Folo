import type { UIMessage } from "@ai-sdk/ui-utils"
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
            <span className="text-text-secondary text-xs font-medium">AI Assistant</span>
          </div>
        )}
        <div
          className={`text-sm leading-relaxed ${message.role === "user" ? "text-white" : "text-text"}`}
        >
          {message.content.split("\n").map((line, index) => {
            // Handle markdown-style formatting
            if (line.startsWith("## ")) {
              return (
                <h3 key={index} className="mb-3 mt-4 text-base font-semibold first:mt-0">
                  {line.replace("## ", "")}
                </h3>
              )
            }
            if (line.startsWith("- ")) {
              return (
                <div key={index} className="mb-2 ml-4 flex items-start gap-2">
                  <span
                    className={`mt-1.5 size-1.5 rounded-full ${message.role === "user" ? "bg-white/70" : "bg-orange"}`}
                  />
                  <span className="flex-1">{line.replace("- ", "")}</span>
                </div>
              )
            }
            if (line.startsWith("**") && line.endsWith("**")) {
              return (
                <div key={index} className="mb-2 font-semibold">
                  {line.replaceAll("**", "")}
                </div>
              )
            }
            if (line.trim() === "") {
              return <div key={index} className="h-3" />
            }
            return (
              <div key={index} className="mb-2 last:mb-0">
                {line}
              </div>
            )
          })}
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
          <span className="text-text-secondary text-xs font-medium">AI Assistant</span>
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
