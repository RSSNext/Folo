import { cn } from "@follow/utils"
import type { EditorState } from "lexical"
import { m } from "motion/react"
import { useCallback, useLayoutEffect, useRef } from "react"

import { useI18n } from "~/hooks/common/useI18n"
import { ChatInput } from "~/modules/ai-chat/components/layouts/ChatInput"
import { ChatShortcutsRow } from "~/modules/ai-chat/components/layouts/ChatShortcutsRow"
import { RateLimitNotice } from "~/modules/ai-chat/components/layouts/RateLimitNotice"

import type { ShortcutData } from "../../editor"
import { useSendAIShortcut } from "../../hooks/useSendAIShortcut"

interface ChatBottomPanelProps {
  hasMessages: boolean
  centerInputOnEmpty?: boolean
  shouldShowInterruptionNotice: boolean
  rateLimitMessage: string | null
  isRateLimited: boolean
  onRetryLastMessage: () => void
  onSendMessage: (message: string | EditorState) => void
  initialDraftState?: EditorState
  onDraftChange: (state: EditorState) => void
  onHeightChange: (height: number) => void
}

export const ChatBottomPanel = ({
  hasMessages,
  centerInputOnEmpty,
  shouldShowInterruptionNotice,
  rateLimitMessage,
  isRateLimited,
  onRetryLastMessage,
  onSendMessage,
  initialDraftState,
  onDraftChange,
  onHeightChange,
}: ChatBottomPanelProps) => {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const t = useI18n()
  const { sendAIShortcut } = useSendAIShortcut()

  useLayoutEffect(() => {
    const element = panelRef.current
    if (!element) return

    const updateHeight = () => {
      onHeightChange(element.offsetHeight)
    }

    updateHeight()

    const resizeObserver = new ResizeObserver(() => {
      updateHeight()
    })

    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
      onHeightChange(0)
    }
  }, [onHeightChange])

  const handleShortcutSelect = useCallback(
    (shortcutData: ShortcutData) => {
      void sendAIShortcut({
        shortcut: shortcutData,
        behavior: "send",
        openPanel: false,
        onSend: (editorState) => {
          onSendMessage(editorState)
        },
      })
    },
    [onSendMessage, sendAIShortcut],
  )

  return (
    <div
      ref={panelRef}
      data-testid="chat-input-container"
      className={cn(
        "absolute z-10 mx-auto duration-500 ease-in-out",
        "inset-x-0 bottom-0 max-w-4xl px-4 pb-4",
        centerInputOnEmpty &&
          !hasMessages &&
          "bottom-1/2 translate-y-[calc(100%+1rem)] duration-200",
      )}
    >
      {shouldShowInterruptionNotice && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="mb-3 flex w-full items-start gap-2 rounded-lg border border-border bg-material-ultra-thick px-3 py-2 text-xs text-text-secondary backdrop-blur-background"
        >
          <i className="i-mingcute-information-fill size-4 flex-shrink-0 text-text" />
          <div className="flex flex-1 items-center justify-between gap-1">
            <span>{t.ai("session.interrupted.message")}</span>
            {!rateLimitMessage && (
              <button
                type="button"
                onClick={onRetryLastMessage}
                className="cursor-button self-start text-xs text-accent duration-200 hover:opacity-80"
              >
                {t.ai("session.interrupted.retry")}
              </button>
            )}
          </div>
        </m.div>
      )}
      <RateLimitNotice message={rateLimitMessage} />
      {!isRateLimited && <ChatShortcutsRow onSelect={handleShortcutSelect} />}
      <ChatInput
        onSend={onSendMessage}
        variant={!hasMessages ? "minimal" : "default"}
        initialDraftState={initialDraftState}
        onEditorStateChange={onDraftChange}
        submitDisabled={isRateLimited}
      />

      {(!centerInputOnEmpty || hasMessages) && (
        <div className="absolute inset-x-0 bottom-0 isolate">
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-44 backdrop-blur-xl backdrop-brightness-110 dark:backdrop-brightness-75"
            style={{
              maskImage: "linear-gradient(to top, black 0%, rgba(0, 0, 0, 0.6) 25%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to top, black 0%, rgba(0, 0, 0, 0.6) 25%, transparent)",
            }}
          />

          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-60 bg-gradient-to-b from-background/20 to-background/0"
            style={{
              maskImage: "linear-gradient(to top, black 20%, transparent 70%)",
              WebkitMaskImage: "linear-gradient(to top, black 20%, transparent 70%)",
              backdropFilter: "blur(50px) saturate(130%)",
              WebkitBackdropFilter: "blur(50px) saturate(130%)",
            }}
          />
        </div>
      )}
    </div>
  )
}
