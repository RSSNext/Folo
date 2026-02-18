import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { AnimatePresence } from "motion/react"
import type { RefObject, UIEventHandler } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { WelcomeScreen } from "~/modules/ai-chat/components/layouts/WelcomeScreen"
import { AIChatWaitingIndicator } from "~/modules/ai-chat/components/message/AIChatMessage"
import type { ChatStatus } from "~/modules/ai-chat/store/slices"

import { Messages } from "./Messages"
import { ScrollToBottomButton } from "./ScrollToBottomButton"

const SCROLL_BOTTOM_THRESHOLD = 100

interface ChatMessageContainerProps {
  currentChatId: string | null
  hasMessages: boolean
  isLoadingHistory: boolean
  isSyncingRemote: boolean
  bottomPanelHeight: number
  messageContainerMinHeight?: number
  messagesContentRef: RefObject<HTMLDivElement | null>
  onScroll: UIEventHandler<HTMLDivElement>
  setScrollAreaRef: (instance: HTMLDivElement | null) => void
  status: ChatStatus
  centerInputOnEmpty?: boolean
  onScrollToBottom: () => void
}

export const ChatMessageContainer = ({
  currentChatId,
  hasMessages,
  isLoadingHistory,
  isSyncingRemote,
  bottomPanelHeight,
  messageContainerMinHeight,
  messagesContentRef,
  onScroll,
  setScrollAreaRef,
  status,
  centerInputOnEmpty,
  onScrollToBottom,
}: ChatMessageContainerProps) => {
  const [isAtBottom, setIsAtBottom] = useState(true)

  useEffect(() => {
    setIsAtBottom(true)
  }, [currentChatId])

  const shouldShowLoadingOverlay = useMemo(() => {
    return Boolean(currentChatId) && !hasMessages && (isLoadingHistory || isSyncingRemote)
  }, [currentChatId, hasMessages, isLoadingHistory, isSyncingRemote])

  const shouldShowScrollToBottom = useMemo(() => {
    return hasMessages && !isAtBottom && !isLoadingHistory
  }, [hasMessages, isAtBottom, isLoadingHistory])

  const handleScrollEvent = useCallback<UIEventHandler<HTMLDivElement>>(
    (event) => {
      const { scrollTop, scrollHeight, clientHeight } = event.currentTarget
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      const atBottom = distanceFromBottom <= SCROLL_BOTTOM_THRESHOLD
      if (atBottom !== isAtBottom) {
        setIsAtBottom(atBottom)
      }
      onScroll(event)
    },
    [isAtBottom, onScroll],
  )

  return (
    <>
      <AnimatePresence>
        {!hasMessages && !shouldShowLoadingOverlay ? (
          <WelcomeScreen centerInputOnEmpty={centerInputOnEmpty} />
        ) : (
          <>
            {shouldShowLoadingOverlay ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex -translate-y-24 flex-col items-center space-y-2">
                  <i className="i-mgc-loading-3-cute-re size-8 animate-spin text-text" />
                  {isSyncingRemote && (
                    <p className="text-sm text-text-secondary">Syncing messages from server...</p>
                  )}
                </div>
              </div>
            ) : null}
            <ScrollArea
              onScroll={handleScrollEvent}
              flex
              scrollbarClassName="mt-12"
              scrollbarProps={{
                style: {
                  marginBottom: Math.max(160, bottomPanelHeight),
                },
              }}
              ref={setScrollAreaRef}
              rootClassName="flex-1"
              viewportProps={{
                style: {
                  paddingBottom: Math.max(128, bottomPanelHeight),
                },
              }}
              viewportClassName="pt-12"
            >
              <div
                className="mx-auto w-full max-w-4xl px-6 py-8"
                style={{
                  minHeight: messageContainerMinHeight
                    ? `${messageContainerMinHeight}px`
                    : undefined,
                }}
              >
                <Messages contentRef={messagesContentRef} />
                {(status === "submitted" || status === "streaming") && <AIChatWaitingIndicator />}
              </div>
            </ScrollArea>
          </>
        )}
      </AnimatePresence>
      {shouldShowScrollToBottom && <ScrollToBottomButton onClick={onScrollToBottom} />}
    </>
  )
}
