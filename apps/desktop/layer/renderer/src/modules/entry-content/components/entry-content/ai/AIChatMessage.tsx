import type { UIMessage } from "@ai-sdk/ui-utils"
import { parseMarkdown } from "@follow/components/utils/parse-markdown.js"
import { stopPropagation } from "@follow/utils"
import { AnimatePresence, m } from "motion/react"
import * as React from "react"
import { toast } from "sonner"

import { copyToClipboard } from "~/lib/clipboard"
import { AIChatContext } from "~/modules/ai/chat/__internal__/AIChatContext"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface MessagePartsProps {
  message: UIMessage
}

const MessageParts: React.FC<MessagePartsProps> = ({ message }) => {
  const [expandedTools, setExpandedTools] = React.useState<Set<string>>(() => new Set())

  const toggleToolExpansion = React.useCallback((toolId: string) => {
    setExpandedTools((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(toolId)) {
        newSet.delete(toolId)
      } else {
        newSet.add(toolId)
      }
      return newSet
    })
  }, [])

  if (!message.parts || message.parts.length === 0) {
    // Fallback to content if no parts (backward compatibility)
    if (message.content) {
      return parseMarkdown(message.content).content
    }
    if (message.role === "assistant") {
      return <span className="text-text-secondary italic">AI is thinking...</span>
    }
    return null
  }

  return (
    <>
      {message.parts.map((part, index) => {
        const partKey = `${message.id}-part-${index}`

        switch (part.type) {
          case "text": {
            return (
              <div key={partKey} className="text-sm">
                {parseMarkdown(part.text).content}
              </div>
            )
          }

          case "tool-invocation": {
            const { toolInvocation } = part
            const { toolName, state } = toolInvocation
            const isExpanded = expandedTools.has(partKey)

            return (
              <m.button
                key={partKey}
                className="bg-material-medium border-border w-full cursor-pointer overflow-hidden rounded-lg border text-left"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={() => toggleToolExpansion(partKey)}
              >
                <div className="flex items-center gap-3 py-1 pl-4 pr-2">
                  {/* Tool Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs">
                      <i className="i-mingcute-tool-line" />
                      <span className="text-text-secondary">Tool Calling:</span>
                      <h4 className="text-text truncate font-medium">{toolName}</h4>
                    </div>
                    {state === "partial-call" && (
                      <p className="text-text-tertiary mt-1 text-xs">Executing tool...</p>
                    )}
                  </div>

                  {/* Expand Arrow */}
                  {(state === "call" || state === "result") && (
                    <span className="text-text-tertiary hover:text-text flex cursor-pointer items-center justify-center rounded-lg p-1 transition-colors">
                      <i
                        className={`i-mingcute-down-line size-4 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </span>
                  )}
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (state === "call" || state === "result") && (
                    <m.div
                      className="border-t border-zinc-200/50 bg-zinc-50/50 p-4 dark:border-zinc-700/50 dark:bg-zinc-800/50"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <div className="space-y-3">
                        {(state === "call" || state === "result") && "args" in toolInvocation && (
                          <div>
                            <div className="text-text-tertiary mb-2 text-xs font-semibold uppercase tracking-wide">
                              Arguments
                            </div>
                            <pre className="text-text-secondary max-h-32 overflow-auto rounded-lg bg-zinc-100/80 p-3 text-xs leading-relaxed dark:bg-zinc-900/80">
                              {JSON.stringify(toolInvocation.args, null, 2)}
                            </pre>
                          </div>
                        )}

                        {state === "result" && "result" in toolInvocation && (
                          <div>
                            <div className="text-text-tertiary mb-2 text-xs font-semibold uppercase tracking-wide">
                              Result
                            </div>
                            <pre className="text-text max-h-32 overflow-auto rounded-lg bg-zinc-100/80 p-3 text-xs leading-relaxed dark:bg-zinc-900/80">
                              {JSON.stringify(toolInvocation.result, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </m.button>
            )
          }

          // case "reasoning": {
          //   return (
          //     <details key={partKey} className="my-2">
          //       <summary className="text-text-tertiary hover:text-text cursor-pointer text-sm font-medium">
          //         <i className="i-mgc-brain-cute-re mr-2 size-3" />
          //         Show reasoning
          //       </summary>
          //       <div className="bg-fill-secondary border-purple/50 text-text-secondary mt-2 rounded border-l-4 p-3 text-sm">
          //         {parseMarkdown(part.reasoning).content}
          //       </div>
          //     </details>
          //   )
          // }

          case "step-start": {
            return <hr key={partKey} className="border-border my-2" />
          }

          default: {
            return null
          }
        }
      })}
    </>
  )
}

interface AIChatMessageProps {
  message: UIMessage
  onEdit?: (messageId: string) => void
}

export const AIChatMessage: React.FC<AIChatMessageProps> = ({ message }) => {
  const { reload } = React.use(AIChatContext)
  const [isHovered, setIsHovered] = React.useState(false)

  const handleCopy = React.useCallback(async () => {
    try {
      // Copy the text content from parts or fallback to content
      const textContent =
        message.parts
          ?.filter((part) => part.type === "text")
          .map((part) => part.text)
          .join(" ") ||
        message.content ||
        ""

      await copyToClipboard(textContent)
      toast.success("Message copied to clipboard")
    } catch {
      toast.error("Failed to copy message")
    }
  }, [message])

  const handleRetry = React.useCallback(() => {
    reload()
  }, [reload])

  return (
    <m.div
      onContextMenu={stopPropagation}
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex max-w-[calc(100%-1rem)] flex-col gap-2">
        <div
          className={`rounded-xl px-3 py-2.5 backdrop-blur-sm ${
            message.role === "user"
              ? "bg-accent/30 text-white"
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
            <MessageParts message={message} />
          </div>
          <div
            className={`mt-2 text-xs ${message.role === "user" ? "text-right text-white/70" : "text-text-tertiary"}`}
          >
            {message.createdAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>

        {/* Action buttons */}
        <m.div
          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} gap-1`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            scale: isHovered ? 1 : 0.8,
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {message.role === "user" ? (
            <>
              {/* <button
                type="button"
                onClick={handleEdit}
                className="text-text-tertiary hover:bg-fill hover:text-text flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors"
                title="Edit message"
              >
                <i className="i-mgc-edit-cute-re size-3" />
                <span>Edit</span>
              </button> */}
              <button
                type="button"
                onClick={handleRetry}
                className="text-text-tertiary hover:bg-fill hover:text-text flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors"
                title="Retry"
              >
                <i className="i-mgc-refresh-2-cute-re size-3" />
                <span>Retry</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleCopy}
              className="text-text-tertiary hover:bg-fill hover:text-text flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors"
              title="Copy message"
            >
              <i className="i-mgc-copy-2-cute-re size-3" />
              <span>Copy</span>
            </button>
          )}
        </m.div>
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
