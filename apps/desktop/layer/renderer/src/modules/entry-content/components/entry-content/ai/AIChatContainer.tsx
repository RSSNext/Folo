import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { AnimatePresence, m } from "motion/react"
import * as React from "react"

import { AIChatContext, AIPanelRefsContext } from "~/modules/ai/chat/__internal__/AIChatContext"

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
        <div className="from-accent mx-auto flex size-16 items-center justify-center rounded-full bg-gradient-to-br to-red-500">
          <i className="i-mgc-ai-cute-re size-8 text-white" />
        </div>

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

const SendingMessageOverlay: React.FC<{
  message: string
  inputRect: DOMRect | null
  messagesAreaRect: DOMRect | null
  onAnimationComplete: () => void
}> = ({ message, inputRect, messagesAreaRect, onAnimationComplete }) => {
  if (!inputRect) return null

  // Calculate the target position for the animation
  const targetY = messagesAreaRect
    ? -(inputRect.bottom - messagesAreaRect.bottom + 80) // Move to the bottom of the message area
    : -200 // Default to move up more distance

  return (
    <m.div
      className="pointer-events-none fixed z-50"
      style={{
        left: inputRect.left + 6,
        top: inputRect.top + 6,
        width: inputRect.width - 12,
        height: Math.max(inputRect.height - 12, 40),
      }}
      initial={{
        scale: 1,
        opacity: 1,
        y: 0,
      }}
      animate={{
        y: targetY,
        scale: 0.82,
        opacity: 0,
      }}
      transition={{
        duration: 0.45,
        ease: [0.25, 0.46, 0.45, 0.94], // iOS style easing function
      }}
      onAnimationComplete={onAnimationComplete}
    >
      <m.div
        className="from-orange relative flex h-full items-center justify-between rounded-xl bg-gradient-to-r to-red-500 px-4 py-3 text-white shadow-lg"
        initial={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
        animate={{
          boxShadow:
            "0 20px 25px -5px rgba(255, 69, 58, 0.3), 0 10px 10px -5px rgba(255, 69, 58, 0.2)",
        }}
        transition={{ duration: 0.2 }}
      >
        <span className="text-sm font-medium leading-tight">{message}</span>
        <m.div
          className="ml-3 flex items-center"
          initial={{ scale: 1, rotate: 0 }}
          animate={{ scale: 1.1, rotate: 15 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <i className="i-mgc-send-plane-cute-fi size-4" />
        </m.div>
      </m.div>
    </m.div>
  )
}

export const AIChatContainer: React.FC<AIChatContainerProps> = React.memo(
  ({ disabled, onSendMessage }) => {
    const { inputRef } = React.use(AIPanelRefsContext)
    const scrollAreaRef = React.useRef<HTMLDivElement>(null)
    const { messages, status } = React.use(AIChatContext)

    // Sending animation state
    const [sendingMessage, setSendingMessage] = React.useState<string | null>(null)
    const [inputRect, setInputRect] = React.useState<DOMRect | null>(null)
    const [messagesAreaRect, setMessagesAreaRect] = React.useState<DOMRect | null>(null)

    // Auto-scroll logic
    const { resetScrollState, scrollToBottom } = useAutoScroll(
      scrollAreaRef.current,
      status === "streaming",
    )

    const handleSendMessage = (message: string) => {
      // Get the input box position for the animation
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect()
        setInputRect(rect)
        setSendingMessage(message)

        // Get the message area position
        if (scrollAreaRef.current) {
          const messagesRect = scrollAreaRef.current.getBoundingClientRect()
          setMessagesAreaRect(messagesRect)
        }

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

    const handleAnimationComplete = () => {
      setSendingMessage(null)
      setInputRect(null)
      setMessagesAreaRect(null)
    }

    // Show welcome screen if no messages
    const showWelcome = messages.length === 0

    return (
      <>
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
          <div className="border-border pb-safe-offset-3 shrink-0 border-t px-6 pt-6">
            <AIChatInput
              inputRef={inputRef}
              onSend={handleSendMessage}
              disabled={disabled}
              placeholder={showWelcome ? "What are your thoughts?" : "Ask me anything..."}
            />
          </div>
        </div>

        {/* Sending message animation overlay */}
        <AnimatePresence>
          {sendingMessage && inputRect && (
            <SendingMessageOverlay
              message={sendingMessage}
              inputRect={inputRect}
              messagesAreaRect={messagesAreaRect}
              onAnimationComplete={handleAnimationComplete}
            />
          )}
        </AnimatePresence>
      </>
    )
  },
)
