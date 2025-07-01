import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import * as React from "react"

import { AIChatContext, AIPanelRefsContext } from "~/modules/ai/chat/__internal__/AIChatContext"

import { AIChatInput } from "./AIChatInput"
import { AIChatMessage, AIChatTypingIndicator } from "./AIChatMessage"
import { useAutoScroll } from "./useAutoScroll"

interface AIChatContainerProps {
  disabled?: boolean
  onSendMessage?: (message: string) => void
}

// Welcome screen suggestions
const welcomeSuggestions = [
  {
    icon: "i-mgc-translate-2-cute-re",
    text: "Read a foreign language article with AI",
    action: "translate",
  },
  {
    icon: tw`i-mingcute-mind-map-line`,
    text: "Tidy an article with AI MindMap Action",
    action: "mindmap",
  },

  {
    icon: tw`i-mingcute-comment-2-line`,
    text: "Freely communicate with AI",
    action: "chat",
  },
]

const Welcome = () => {
  const handleSuggestionClick = (_action: string) => {
    // TODO: Implement suggestion click
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      {/* AI Icon */}
      <div className="mb-8">
        <div className="from-orange flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br to-red-500 shadow-lg">
          <div className="relative">
            <i className="i-mgc-ai-cute-re size-8 text-white" />
            <div className="from-orange/20 absolute -inset-2 animate-pulse rounded-full bg-gradient-to-br to-red-500/20" />
          </div>
        </div>
      </div>

      {/* Welcome Title */}
      <div className="mb-4 text-center">
        <h2 className="text-text mb-2 text-xl font-semibold">What can I help you with?</h2>
      </div>

      {/* Suggestions */}
      <div className="w-full max-w-md">
        {welcomeSuggestions.map((suggestion, index) => (
          <button
            type="button"
            key={index}
            onClick={() => handleSuggestionClick(suggestion.action)}
            className="hover:bg-fill-secondary group flex w-full items-center gap-4 rounded-xl p-4 text-left transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="bg-fill-tertiary group-hover:bg-fill-secondary flex size-10 items-center justify-center rounded-lg transition-colors">
              <i className={`${suggestion.icon} text-text-secondary size-5`} />
            </div>
            <span className="text-text flex-1 text-sm font-medium">{suggestion.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export const AIChatContainer: React.FC<AIChatContainerProps> = ({ disabled, onSendMessage }) => {
  const { inputRef } = React.use(AIPanelRefsContext)
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const { messages, status } = React.use(AIChatContext)

  // Auto-scroll logic
  const { resetScrollState, scrollToBottom } = useAutoScroll(
    scrollAreaRef.current,
    status === "streaming",
  )

  const handleSendMessage = (message: string) => {
    if (onSendMessage) {
      onSendMessage(message)
    } else {
      // Demo fallback
      console.info("Sending message:", message)
    }
    if (inputRef.current) {
      inputRef.current.value = ""
    }

    // Reset scroll state when sending a new message
    resetScrollState()

    // Scroll to bottom after new message
    requestAnimationFrame(() => {
      scrollToBottom()
    })
  }

  // // Scroll to bottom when messages change (new message added)
  // React.useEffect(() => {
  //   if (messages.length > 0) {
  //     requestAnimationFrame(() => {
  //       scrollToBottom()
  //     })
  //   }
  // }, [messages.length, scrollToBottom])

  // Show welcome screen if no messages
  const showWelcome = messages.length === 0

  return (
    <div className="flex h-full flex-col">
      {showWelcome ? (
        <Welcome />
      ) : (
        // Chat messages
        <ScrollArea
          ref={scrollAreaRef}
          flex
          viewportClassName="p-6"
          rootClassName="min-h-[500px] flex-1"
        >
          <div className="flex flex-col gap-6">
            {messages.map((message) => (
              <AIChatMessage key={message.id} message={message} />
            ))}
            {status === "submitted" && <AIChatTypingIndicator />}
          </div>
        </ScrollArea>
      )}

      {/* Input area */}
      <div className="border-border pb-safe-offset-3 shrink-0 border px-6 pt-6">
        <AIChatInput
          inputRef={inputRef}
          onSend={handleSendMessage}
          disabled={disabled}
          placeholder={showWelcome ? "What are your thoughts?" : "Ask me anything..."}
        />
      </div>
    </div>
  )
}
