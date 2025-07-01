import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { AnimatePresence, m } from "motion/react"
import * as React from "react"

import { AIChatContext, AIPanelRefsContext } from "~/modules/ai/chat/__internal__/AIChatContext"

import { AIChatInput } from "./AIChatInput"
import { AIChatMessage, AIChatTypingIndicator } from "./AIChatMessage"
import { useAutoScroll } from "./useAutoScroll"

interface AIChatContainerProps {
  disabled?: boolean
  onSendMessage?: (message: string) => void
}

// 发送中的消息动画组件
const SendingMessageOverlay: React.FC<{
  message: string
  inputRect: DOMRect | null
  messagesAreaRect: DOMRect | null
  onAnimationComplete: () => void
}> = ({ message, inputRect, messagesAreaRect, onAnimationComplete }) => {
  if (!inputRect) return null

  // 计算动画的目标位置
  const targetY = messagesAreaRect
    ? -(inputRect.bottom - messagesAreaRect.bottom + 80) // 移动到消息区域底部
    : -200 // 默认向上移动更多距离

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
        ease: [0.25, 0.46, 0.45, 0.94], // iOS 风格缓动函数
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

// Welcome screen suggestions
const welcomeSuggestions = [
  {
    icon: "i-mgc-translate-2-cute-re",
    text: "Read a foreign language article with AI",
    action: "translate",
  },
  {
    icon: "i-mgc-mind-map-cute-re",
    text: "Tidy an article with AI MindMap Action",
    action: "mindmap",
  },
  {
    icon: "i-mgc-comment-2-cute-re",
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

  // 发送动画状态
  const [sendingMessage, setSendingMessage] = React.useState<string | null>(null)
  const [inputRect, setInputRect] = React.useState<DOMRect | null>(null)
  const [messagesAreaRect, setMessagesAreaRect] = React.useState<DOMRect | null>(null)

  // Auto-scroll logic
  const { resetScrollState, scrollToBottom } = useAutoScroll(
    scrollAreaRef.current,
    status === "streaming",
  )

  const handleSendMessage = (message: string) => {
    // 获取输入框位置用于动画
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setInputRect(rect)
      setSendingMessage(message)

      // 获取消息区域位置
      if (scrollAreaRef.current) {
        const messagesRect = scrollAreaRef.current.getBoundingClientRect()
        setMessagesAreaRect(messagesRect)
      }

      // 清空输入框
      inputRef.current.value = ""
    }

    // 调用实际的发送逻辑
    if (onSendMessage) {
      onSendMessage(message)
    } else {
      // Demo fallback
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
        <div className="border-border pb-safe-offset-3 shrink-0 border px-6 pt-6">
          <AIChatInput
            inputRef={inputRef}
            onSend={handleSendMessage}
            disabled={disabled}
            placeholder={showWelcome ? "What are your thoughts?" : "Ask me anything..."}
          />
        </div>
      </div>

      {/* 发送消息动画覆盖层 */}
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
}
