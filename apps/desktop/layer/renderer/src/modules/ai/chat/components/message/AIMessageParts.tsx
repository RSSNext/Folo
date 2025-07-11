import type { ToolUIPart } from "ai"
import { m } from "motion/react"
import * as React from "react"

import type {
  AIDisplayAnalyticsTool,
  AIDisplayEntriesTool,
  AIDisplayFeedsTool,
  AIDisplaySubscriptionsTool,
  BizUIMessage,
} from "~/modules/ai/chat/__internal__/types"

import {
  AIDisplayAnalyticsPart,
  AIDisplayEntriesPart,
  AIDisplayFeedsPart,
  AIDisplaySubscriptionsPart,
} from "../displays"
import { ToolInvocationComponent } from "../ToolInvocationComponent"
import { AIMarkdownMessage } from "./AIMarkdownMessage"

interface MessagePartsProps {
  message: BizUIMessage
}
const ThinkingIndicator: React.FC = () => {
  const text = "Thinking..."
  const [displayedText, setDisplayedText] = React.useState("")
  const [currentIndex, setCurrentIndex] = React.useState(0)

  React.useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [currentIndex, text])

  return (
    <div className="flex items-center justify-center py-4">
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-text-secondary flex items-center gap-1"
      >
        <span className="text-sm font-medium">{displayedText}</span>
        <m.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="text-accent text-sm"
        >
          |
        </m.span>
      </m.div>
    </div>
  )
}
export const AIMessageParts: React.FC<MessagePartsProps> = React.memo(({ message }) => {
  if (!message.parts || message.parts.length === 0) {
    // In AI SDK v5, messages should always have parts
    if (message.role === "assistant") {
      return <ThinkingIndicator />
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
                isProcessing={message.metadata?.totalTokens === undefined}
                key={partKey}
                text={part.text}
                className={isUser ? "text-white" : "text-text"}
              />
            )
          }

          case "tool-displayAnalytics": {
            return <AIDisplayAnalyticsPart key={partKey} part={part as AIDisplayAnalyticsTool} />
          }
          case "tool-displayEntries": {
            return <AIDisplayEntriesPart key={partKey} part={part as AIDisplayEntriesTool} />
          }
          case "tool-displaySubscriptions": {
            return (
              <AIDisplaySubscriptionsPart key={partKey} part={part as AIDisplaySubscriptionsTool} />
            )
          }
          case "tool-displayFeeds": {
            return <AIDisplayFeedsPart key={partKey} part={part as AIDisplayFeedsTool} />
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

          default: {
            if (part.type.startsWith("tool-")) {
              return <ToolInvocationComponent key={partKey} part={part as ToolUIPart} />
            }
            return null
          }
        }
      })}
    </>
  )
})

AIMessageParts.displayName = "AIMessageParts"
