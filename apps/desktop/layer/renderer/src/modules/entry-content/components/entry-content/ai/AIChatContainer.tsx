import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { cn, nextFrame } from "@follow/utils"
import * as React from "react"

import { AIChatContext, AIPanelRefsContext } from "~/modules/ai/chat/__internal__/AIChatContext"
import { AISpline } from "~/modules/ai/icon"

import { AIChatBottom } from "./AIChatBottom"
import { AIChatInput } from "./AIChatInput"
import { AIChatMessage, AIChatTypingIndicator } from "./AIChatMessage"
import { useAutoScroll } from "./useAutoScroll"

declare const APP_NAME: string

interface AIChatContainerProps {
  disabled?: boolean
  onSendMessage?: (message: string) => void
}

const Welcome: React.FC = () => {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md space-y-6 text-center">
        <AISpline className="mx-auto size-16" />

        <div>
          <h2 className="text-text mb-2 text-xl font-semibold">Welcome to {APP_NAME} AI</h2>
          <p className="text-text-secondary text-sm">
            I can help you analyze content, answer questions, and provide insights about your feeds.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-text-tertiary text-xs">Ask me anything about:</p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="bg-fill-tertiary text-text-secondary rounded-full px-3 py-1 text-xs">
              Content analysis
            </span>
            <span className="bg-fill-tertiary text-text-secondary rounded-full px-3 py-1 text-xs">
              Summaries
            </span>
            <span className="bg-fill-tertiary text-text-secondary rounded-full px-3 py-1 text-xs">
              Insights
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export const AIChatContainer: React.FC<AIChatContainerProps> = React.memo(
  ({ disabled, onSendMessage }) => {
    const { inputRef } = React.use(AIPanelRefsContext)
    const scrollAreaRef = React.useRef<HTMLDivElement>(null)
    const { messages, status } = React.use(AIChatContext)

    // Auto-scroll logic
    const { resetScrollState, scrollToBottom } = useAutoScroll(
      scrollAreaRef.current,
      status === "streaming",
    )

    // Auto-scroll to bottom when initial messages are loaded
    React.useEffect(() => {
      nextFrame(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
        }
      })
    }, [])

    const handleSendMessage = (message: string) => {
      if (inputRef.current) {
        inputRef.current.value = ""
      }

      // Call the actual sending logic
      if (onSendMessage) {
        onSendMessage(message)
      } else {
        // Demo fallback for no onSendMessage
        console.info("Sending message:", message)
      }

      // Reset scroll state when sending a new message
      resetScrollState()

      // Scroll to bottom after new message
      requestAnimationFrame(() => {
        scrollToBottom()
      })
    }

    // Show welcome screen if no messages
    const showWelcome = messages.length === 0

    return (
      <>
        <div className="flex min-h-0 grow flex-col">
          {showWelcome && <Welcome />}

          <ScrollArea
            ref={scrollAreaRef}
            flex
            viewportClassName="p-6"
            rootClassName={cn("min-h-[500px] flex-1", showWelcome && "hidden")}
          >
            <div className="flex flex-col gap-2">
              {messages.map((message) => (
                <AIChatMessage key={message.id} message={message} />
              ))}
              {status === "submitted" && <AIChatTypingIndicator />}
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="border-border pb-safe shrink-0 border-t">
            <AIChatBottom>
              <AIChatInput
                onSend={handleSendMessage}
                disabled={disabled}
                placeholder={showWelcome ? "What are your thoughts?" : "Ask me anything..."}
              />
            </AIChatBottom>
          </div>
        </div>
      </>
    )
  },
)
