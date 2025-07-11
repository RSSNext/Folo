import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { cn, nextFrame } from "@follow/utils"
import * as React from "react"

import { useDialog } from "~/components/ui/modal/stacked/hooks"
import { AISpline } from "~/modules/ai/AISpline"
import { AIChatContext, AIPanelRefsContext } from "~/modules/ai/chat/__internal__/AIChatContext"
import {
  AIChatMessage,
  AIChatTypingIndicator,
} from "~/modules/ai/chat/components/message/AIChatMessage"
import { useAutoScroll } from "~/modules/ai/chat/hooks/useAutoScroll"
import { useLoadMessages } from "~/modules/ai/chat/hooks/useLoadMessages"
import { useSaveMessages } from "~/modules/ai/chat/hooks/useSaveMessages"

import { AIChatBottom } from "./AIChatBottom"
import { AIChatInput } from "./AIChatInput"

declare const APP_NAME: string

interface AIChatContainerProps {
  onSendMessage?: (message: string) => void
}

const Welcome: React.FC = () => {
  const { inputRef } = React.use(AIPanelRefsContext)

  const { ask } = useDialog()
  const guardChangeValue = (toValue: string) => {
    const { value } = inputRef.current

    const fn = () => {
      inputRef.current.value = toValue
      nextFrame(() => {
        inputRef.current.focus()

        inputRef.current.selectionStart = inputRef.current.selectionEnd = toValue.length
      })
    }
    if (value) {
      ask({
        title: "Confirm Change",
        message:
          "Are you sure you want to change the value to recommend? This will overwrite the current value.",
        confirmText: "Change",
        cancelText: "Cancel",
        variant: "warning",

        onConfirm: () => {
          fn()
        },
      })
    } else {
      fn()
    }
  }
  const items = [
    {
      tag: "Content analysis",
      onClick: () => {
        guardChangeValue("Analyze the content of this entry")
      },
    },
    {
      tag: "Summaries",
      onClick: () => {
        guardChangeValue("Summarize the content of this entry")
      },
    },
    {
      tag: "Insights",
      onClick: () => {
        guardChangeValue("Provide insights about the content of this entry")
      },
    },
  ]

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md space-y-6 text-center">
        <AISpline />

        <div>
          <h2 className="text-text mb-2 text-xl font-semibold">Welcome to {APP_NAME} AI</h2>
          <p className="text-text-secondary text-sm">
            I can help you analyze content, answer questions, and provide insights about your feeds.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-text-tertiary text-xs">Ask me anything about:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {items.map((item) => (
              <button
                key={item.tag}
                className="bg-fill-tertiary text-text-secondary hover:bg-fill-secondary rounded-full px-3 py-1 text-xs"
                onClick={item.onClick}
                type="button"
              >
                {item.tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export const AIChatContainer: React.FC<AIChatContainerProps> = React.memo(({ onSendMessage }) => {
  const { inputRef } = React.use(AIPanelRefsContext)
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const { messages, status, id: roomId } = React.use(AIChatContext)

  const scrollToBottom = React.useCallback(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [])
  // Auto-scroll logic
  const { resetScrollState, scrollToBottom: scrollToBottomAnimated } = useAutoScroll(
    scrollAreaRef.current,
    status === "streaming",
  )
  const { isLoading: isLoadingHistory } = useLoadMessages(roomId, {
    onLoad: scrollToBottom,
  })
  useSaveMessages(roomId, { enabled: !isLoadingHistory })

  // Auto-scroll to bottom when initial messages are loaded
  React.useEffect(() => {
    nextFrame(() => {
      scrollToBottom()
    })
  }, [scrollToBottom])

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
      scrollToBottomAnimated()
    })
  }

  // Show welcome screen if no messages
  const showWelcome = messages.length === 0 && !isLoadingHistory

  return (
    <>
      <div className="flex min-h-0 grow flex-col">
        {showWelcome && <Welcome />}
        {isLoadingHistory && (
          <div className="center absolute inset-0 flex">
            <i className="i-mgc-loading-3-cute-re text-text size-6 animate-spin" />
          </div>
        )}

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
              placeholder={showWelcome ? "What are your thoughts?" : "Ask me anything..."}
            />
          </AIChatBottom>
        </div>
      </div>
    </>
  )
})
