import type { UIMessage } from "@ai-sdk/ui-utils"
import { parseMarkdown } from "@follow/components/utils/parse-markdown.js"
import { AnimatePresence, m } from "motion/react"
import * as React from "react"

import { AIMarkdownMessage } from "../../../../ai/chat/AIMarkdownMessage"

interface MessagePartsProps {
  message: UIMessage
}

export const AIMessageParts: React.FC<MessagePartsProps> = ({ message }) => {
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
            return <AIMarkdownMessage key={partKey} text={part.text} />
          }

          case "tool-invocation": {
            const { toolInvocation } = part
            const { toolName, state } = toolInvocation
            const isExpanded = expandedTools.has(partKey)

            return (
              <div
                key={partKey}
                className="bg-material-medium border-border w-full overflow-hidden rounded-lg border text-left"
              >
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-3 py-1 pl-4 pr-2"
                  onClick={() => toggleToolExpansion(partKey)}
                >
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
                </button>

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
              </div>
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
