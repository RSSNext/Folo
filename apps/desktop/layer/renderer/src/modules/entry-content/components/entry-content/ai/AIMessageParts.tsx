import type { UIMessage } from "@ai-sdk/ui-utils"
import { parseMarkdown } from "@follow/components/utils/parse-markdown.js"
import * as React from "react"

import { AIMarkdownMessage } from "../../../../ai/chat/AIMarkdownMessage"
import { ToolInvocationComponent } from "./ToolInvocationComponent"

interface MessagePartsProps {
  message: UIMessage
}

export const AIMessageParts: React.FC<MessagePartsProps> = ({ message }) => {
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
  const isUser = message.role === "user"
  return (
    <>
      {message.parts.map((part, index) => {
        const partKey = `${message.id}-part-${index}`

        switch (part.type) {
          case "text": {
            return (
              <AIMarkdownMessage
                key={partKey}
                text={part.text}
                className={isUser ? "text-white" : "text-text"}
              />
            )
          }

          case "tool-invocation": {
            const { toolInvocation } = part

            return <ToolInvocationComponent key={partKey} toolInvocation={toolInvocation} />
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
