import { useGlobalFocusableScopeSelector } from "@follow/components/common/Focusable/hooks.js"
import { ActionButton, Button } from "@follow/components/ui/button/index.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { cn, nextFrame } from "@follow/utils"
import { m } from "motion/react"
import { use, useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Focusable } from "~/components/common/Focusable"
import { useDialog } from "~/components/ui/modal/stacked/hooks"
import { HotkeyScope } from "~/constants"
import { AIChatContext, AIPanelRefsContext } from "~/modules/ai/chat/__internal__/AIChatContext"
import { AIChatContextBar } from "~/modules/ai/chat/AIChatContextBar"
import { AIChatMessage, AIChatTypingIndicator } from "~/modules/ai/chat/AIChatMessage"
import { AIChatRoot } from "~/modules/ai/chat/AIChatRoot"
import { useAutoScroll } from "~/modules/ai/chat/hooks/useAutoScroll"
import { useLoadMessages } from "~/modules/ai/chat/hooks/useLoadMessages"
import { useSaveMessages } from "~/modules/ai/chat/hooks/useSaveMessages"
import { AISpline } from "~/modules/ai/icon"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal-hack"

const ChatHeader = () => {
  const settingModalPresent = useSettingModal()
  const { setMessages, messages } = use(AIChatContext)

  const { ask } = useDialog()

  const { t } = useTranslation("ai")
  const handleNewChat = useCallback(() => {
    if (messages.length === 0) {
      return
    }

    ask({
      title: t("clear_chat"),
      message: t("clear_chat_message"),
      variant: "danger",
      onConfirm: () => {
        setMessages([])
      },
    })
  }, [setMessages, ask, messages.length, t])

  return (
    <div className="absolute inset-x-0 top-0 z-20 h-16">
      <div
        className="bg-background/70 backdrop-blur-background absolute inset-0"
        style={{
          maskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
        }}
      />

      <div className="relative z-10 flex h-full items-center justify-end px-6">
        <div className="flex items-center gap-2">
          <ActionButton tooltip="New Chat" onClick={handleNewChat}>
            <i className="i-mgc-add-cute-re text-base" />
          </ActionButton>

          <ActionButton tooltip="AI Settings" onClick={() => settingModalPresent("ai")}>
            <i className="i-mgc-user-setting-cute-re text-base" />
          </ActionButton>
        </div>
      </div>
    </div>
  )
}

const WelcomeScreen = ({ onSend }: { onSend: (message: string) => void }) => {
  const { t } = useTranslation("ai")
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="space-y-6">
          <div className="mx-auto size-16">
            <AISpline />
          </div>
          <div className="space-y-2">
            <h1 className="text-text text-2xl font-semibold">{APP_NAME} AI</h1>
            <p className="text-text-secondary text-sm">{t("welcome_description")}</p>
          </div>
        </div>

        <div className="mx-auto max-w-2xl">
          <WelcomeChatInput onSend={onSend} />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            "Analyze my reading patterns",
            "Summarize recent articles",
            "Find trending topics",
            "Organize my feeds",
          ].map((suggestion, index) => (
            <m.button
              key={suggestion}
              className="bg-material-medium hover:bg-material-thick border-border text-text-secondary hover:text-text rounded-full border px-4 py-2 text-xs transition-colors"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSend(suggestion)}
            >
              {suggestion}
            </m.button>
          ))}
        </div>
      </div>
    </div>
  )
}

const WelcomeChatInput = ({ onSend }: { onSend: (message: string) => void }) => {
  const [inputValue, setInputValue] = useState("")
  const [isEmpty, setIsEmpty] = useState(true)

  const handleSend = useCallback(() => {
    if (inputValue.trim()) {
      onSend(inputValue.trim())
      setInputValue("")
      setIsEmpty(true)
    }
  }, [inputValue, onSend])

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target
    setInputValue(value)
    setIsEmpty(value.trim() === "")
  }, [])

  return (
    <div className="bg-background border-border relative overflow-hidden rounded-2xl border shadow-lg shadow-zinc-100 dark:shadow-black/5">
      <textarea
        onChange={handleChange}
        onKeyDown={handleKeyPress}
        placeholder="Message AI assistant..."
        className="scrollbar-none text-text placeholder:text-text-secondary max-h-40 min-h-14 w-full resize-none bg-transparent px-5 py-3.5 pr-14 text-sm !outline-none transition-all duration-200"
        rows={1}
        autoFocus
      />
      <div className="absolute right-3 top-3">
        <Button
          size="sm"
          onClick={handleSend}
          disabled={isEmpty}
          buttonClassName={cn(
            "size-8 rounded-lg p-0 transition-all duration-200",
            isEmpty
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md",
          )}
        >
          <i className="i-mgc-send-plane-cute-fi size-4 text-white" />
        </Button>
      </div>
    </div>
  )
}

const ChatInput = ({ onSend }: { onSend: (message: string) => void }) => {
  const { inputRef } = use(AIPanelRefsContext)
  const { status, stop } = use(AIChatContext)
  const [isEmpty, setIsEmpty] = useState(true)

  const isProcessing = status === "submitted" || status === "streaming"

  const handleSend = useCallback(() => {
    if (inputRef.current && inputRef.current.value.trim()) {
      const message = inputRef.current.value.trim()
      onSend(message)
      inputRef.current.value = ""
      setIsEmpty(true)
    }
  }, [onSend, inputRef])

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        if (isProcessing) {
          stop?.()
        } else {
          handleSend()
        }
      }
    },
    [handleSend, isProcessing, stop],
  )

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIsEmpty(e.target.value.trim() === "")
  }, [])

  const hasFocus = useGlobalFocusableScopeSelector(
    useCallback((s) => s.has(HotkeyScope.AIChat), []),
  )
  useEffect(() => {
    const handler = () => {
      if (hasFocus) {
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handler)
    return () => {
      window.removeEventListener("keydown", handler)
    }
  }, [hasFocus, inputRef])

  return (
    <div className="absolute inset-x-0 bottom-0">
      <div className="mx-auto max-w-4xl p-6">
        {/* Integrated Input Container with Context Bar */}
        <div className="bg-background/60 focus-within:ring-accent/20 focus-within:border-accent/80 border-border/80 relative overflow-hidden rounded-2xl border shadow-2xl shadow-black/5 backdrop-blur-xl duration-200 focus-within:ring-2 dark:shadow-zinc-800">
          {/* Input Area */}
          <div className="relative z-10 flex items-end">
            <textarea
              ref={inputRef}
              onChange={handleChange}
              onKeyDown={handleKeyPress}
              placeholder="Message AI assistant..."
              className="scrollbar-none text-text placeholder:text-text-secondary max-h-40 min-h-14 w-full resize-none bg-transparent px-5 py-3.5 pr-14 text-sm !outline-none transition-all duration-200"
              rows={1}
              autoFocus
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Button
                size="sm"
                onClick={isProcessing ? stop : handleSend}
                disabled={!isProcessing && isEmpty}
                buttonClassName={cn(
                  "size-8 rounded-xl p-0 transition-all duration-300 active:scale-95",
                  isProcessing
                    ? "bg-red-500/90 hover:bg-red-500 shadow-lg shadow-red-500/25 backdrop-blur-sm"
                    : isEmpty
                      ? "bg-gray-200/80 cursor-not-allowed backdrop-blur-sm"
                      : "bg-gradient-to-r from-blue-500/90 to-blue-600/90 hover:from-blue-500 hover:to-blue-600 shadow-lg shadow-blue-500/25 backdrop-blur-sm hover:shadow-blue-500/35",
                )}
              >
                {isProcessing ? (
                  <i className="i-mgc-stop-circle-cute-fi size-4 text-white" />
                ) : (
                  <i className="i-mgc-send-plane-cute-fi size-4 text-white" />
                )}
              </Button>
            </div>
          </div>

          {/* Context Bar - Always shown, positioned below the input area */}
          <div className="border-border/20 relative z-10 border-t bg-transparent">
            <AIChatContextBar className="border-0 bg-transparent px-4 py-2.5" />
          </div>
        </div>
      </div>
    </div>
  )
}

const ChatInterface = () => {
  const { messages, status, sendMessage } = use(AIChatContext)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const roomId = "global-ai"
  const { isLoading: isLoadingHistory } = useLoadMessages(roomId, {
    onLoad: () => {
      nextFrame(() => {
        const $scrollArea = scrollAreaRef.current
        const scrollHeight = $scrollArea?.scrollHeight
        if (scrollHeight) {
          $scrollArea?.scrollTo({
            top: scrollHeight,
          })
        }
      })
    },
  })
  useSaveMessages(roomId, { enabled: !isLoadingHistory })

  const { resetScrollState } = useAutoScroll(scrollAreaRef.current, status === "streaming")

  const handleSendMessage = useCallback(
    (message: string) => {
      resetScrollState()

      sendMessage({
        text: message,
        metadata: {
          finishTime: new Date().toISOString(),
        },
      })
    },
    [sendMessage, resetScrollState],
  )

  useEffect(() => {
    if (status === "submitted") {
      resetScrollState()
    }
  }, [status, resetScrollState])

  const hasMessages = messages.length > 0

  return (
    <div className="flex size-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        {!hasMessages && !isLoadingHistory ? (
          <WelcomeScreen onSend={handleSendMessage} />
        ) : (
          <ScrollArea ref={scrollAreaRef} rootClassName="flex-1" viewportClassName="pt-12 pb-32">
            {isLoadingHistory ? (
              <div className="flex min-h-96 items-center justify-center">
                <i className="i-mgc-loading-3-cute-re text-text size-8 animate-spin" />
              </div>
            ) : (
              <div className="mx-auto max-w-4xl px-6 py-8">
                {messages.map((message) => (
                  <AIChatMessage key={message.id} message={message} />
                ))}
                {status === "submitted" && <AIChatTypingIndicator />}
              </div>
            )}
          </ScrollArea>
        )}
      </div>

      {hasMessages && <ChatInput onSend={handleSendMessage} />}
    </div>
  )
}

export const AIChatLayout = () => {
  return (
    <AIChatRoot roomId="global-ai" wrapFocusable={false}>
      <Focusable
        scope={HotkeyScope.AIChat}
        className="bg-background relative flex size-full flex-col overflow-hidden"
      >
        <ChatHeader />
        <ChatInterface />
      </Focusable>
    </AIChatRoot>
  )
}
