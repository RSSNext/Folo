import { Folo } from "@follow/components/icons/folo.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { FeedViewType } from "@follow/constants"
import { clsx } from "@follow/utils"
import type { EditorState, LexicalEditor } from "lexical"
import { AnimatePresence, m } from "motion/react"
import { startTransition, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { useAISettingValue } from "~/atoms/settings/ai"
import { ROUTE_ENTRY_PENDING } from "~/constants"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { AISpline } from "~/modules/ai-chat/components/3d-models/AISpline"
import { ZustandChat } from "~/modules/ai-chat/store/chat-core/chat-instance"
import { createChatTransport } from "~/modules/ai-chat/store/transport"
import type { BizUIMessage } from "~/modules/ai-chat/store/types"

import { useAttachScrollBeyond } from "../../hooks/useAttachScrollBeyond"
import { useMainEntryId } from "../../hooks/useMainEntryId"
import { AIMessageParts } from "../message/AIMessageParts"
import { DefaultWelcomeContent, EntrySummaryCard } from "../welcome"

type WelcomeTimelineSummaryStatus = "idle" | "loading" | "success" | "error"

interface WelcomeTimelineSummaryState {
  status: WelcomeTimelineSummaryStatus
  message: BizUIMessage | null
  error?: string
}

interface WelcomeScreenProps {
  onSend: (message: EditorState | string, editor: LexicalEditor | null) => void
  centerInputOnEmpty?: boolean
}

export const WelcomeScreen = ({ onSend, centerInputOnEmpty }: WelcomeScreenProps) => {
  const { t } = useTranslation("ai")
  const aiSettings = useAISettingValue()
  const mainEntryId = useMainEntryId()
  const { view, isAllFeeds, entryId } = useRouteParamsSelector((s) => ({
    view: s.view,
    isAllFeeds: s.isAllFeeds,
    entryId: s.entryId,
  }))

  const [timelineSummary, setTimelineSummary] = useState<WelcomeTimelineSummaryState>({
    status: "idle",
    message: null,
  })

  const realEntryId = entryId === ROUTE_ENTRY_PENDING ? "" : entryId
  const isAllView = view === FeedViewType.All && isAllFeeds && !realEntryId

  const hasEntryContext = !!mainEntryId
  const enabledShortcuts = aiSettings.shortcuts?.filter((shortcut) => shortcut.enabled) || []
  const shouldFetchTimelineSummary = isAllView && !hasEntryContext

  useEffect(() => {
    if (!shouldFetchTimelineSummary) {
      setTimelineSummary({ status: "idle", message: null, error: undefined })
      return
    }

    let isCancelled = false

    const placeholderMessage: BizUIMessage = {
      id: "timeline-summary",
      role: "assistant",
      parts: [],
    }

    setTimelineSummary({
      status: "loading",
      message: placeholderMessage,
      error: undefined,
    })

    const localSliceRef = {
      current: {
        chatId: "timeline-summary",
        messages: [] as BizUIMessage[],
        status: "ready",
        error: undefined as Error | undefined,
        isStreaming: false,
        currentTitle: undefined as string | undefined,
        chatInstance: null as unknown,
        chatActions: null as unknown,
      },
    }

    const updateChatSlice = (updater: (state: any) => any) => {
      localSliceRef.current = updater(localSliceRef.current)
    }

    const chat = new ZustandChat(
      {
        id: "timeline-summary",
        messages: [],
        transport: createChatTransport(),
      },
      updateChatSlice as any,
    )

    localSliceRef.current.chatInstance = chat

    const unsubscribeMessages = chat.chatState.onMessagesChange((messages) => {
      if (isCancelled) return

      const latestMessage = messages.at(-1) ?? placeholderMessage

      startTransition(() => {
        setTimelineSummary((prev) => ({
          ...prev,
          message: latestMessage,
        }))
      })
    })

    const unsubscribeStatus = chat.chatState.onStatusChange((status) => {
      if (isCancelled) return

      if (status === "submitted" || status === "streaming") {
        startTransition(() => {
          setTimelineSummary((prev) => ({
            ...prev,
            status: "loading",
            error: undefined,
          }))
        })
        return
      }

      if (status === "ready") {
        startTransition(() => {
          setTimelineSummary((prev) => ({
            ...prev,
            status: prev.error ? "error" : "success",
          }))
        })
      }
    })

    const unsubscribeError = chat.chatState.onErrorChange((error) => {
      if (isCancelled || !error) return

      startTransition(() => {
        setTimelineSummary((prev) => ({
          status: "error",
          message: prev.message ?? placeholderMessage,
          error: error.message,
        }))
      })
    })

    const fetchTimelineSummary = async () => {
      try {
        await chat.sendMessage(undefined, {
          body: { scene: "timeline-summary" },
        })
      } catch (error) {
        if (isCancelled) return

        console.error("Failed to fetch timeline summary", error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        setTimelineSummary((prev) => ({
          status: "error",
          message: prev.message ?? placeholderMessage,
          error: errorMessage,
        }))
      }
    }

    fetchTimelineSummary()

    return () => {
      isCancelled = true
      unsubscribeMessages()
      unsubscribeStatus()
      unsubscribeError()
      void chat.stop()
      chat.destroy()
    }
  }, [shouldFetchTimelineSummary])

  const { handleScroll } = useAttachScrollBeyond()
  const showTimelineSummary = shouldFetchTimelineSummary && timelineSummary.status !== "idle"

  return (
    <ScrollArea
      rootClassName="flex min-h-0 flex-1"
      viewportClassName="px-6 pt-24 flex min-h-0 grow"
      scrollbarClassName="mb-40 mt-12"
      flex
      onScroll={handleScroll}
    >
      <div className="mx-auto flex w-full flex-1 flex-col justify-center space-y-8 pb-52">
        {showTimelineSummary ? (
          <TimelineSummarySection
            summary={timelineSummary}
            heading={t("timeline_summary.heading")}
            generatingLabel={t("timeline_summary.generating")}
            emptyLabel={t("timeline_summary.empty")}
            errorLabel={t("timeline_summary.error")}
          />
        ) : (
          <DefaultWelcomeHeader
            description={
              hasEntryContext ? t("welcome_description_contextual") : t("welcome_description")
            }
          />
        )}

        {/* Dynamic Content Area */}
        <div
          className={clsx(
            "relative flex items-start justify-center",
            centerInputOnEmpty && "absolute bottom-0 translate-y-40",
          )}
        >
          <AnimatePresence mode="wait">
            {hasEntryContext ? (
              <EntrySummaryCard key="entry-summary" entryId={mainEntryId} />
            ) : (
              <DefaultWelcomeContent
                key="default-welcome"
                onSend={onSend}
                shortcuts={enabledShortcuts}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </ScrollArea>
  )
}

const DefaultWelcomeHeader = ({ description }: { description: string }) => (
  <m.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6 text-center"
  >
    <div className="mx-auto size-16">
      <AISpline />
    </div>
    <div className="flex flex-col gap-2">
      <h1 className="text-text flex items-center justify-center gap-2 text-2xl font-semibold">
        <Folo className="size-11" /> AI
      </h1>
      <p className="text-text-secondary text-balance text-sm">{description}</p>
    </div>
  </m.div>
)

const TimelineSummarySection = ({
  summary,
  heading,
  generatingLabel,
  emptyLabel,
  errorLabel,
}: {
  summary: WelcomeTimelineSummaryState
  heading: string
  generatingLabel: string
  emptyLabel: string
  errorLabel: string
}) => {
  const isLoading = summary.status === "loading"
  const isError = summary.status === "error"
  const { message } = summary
  const hasContent =
    message?.parts.some((part) => {
      if (part.type === "text" || part.type === "reasoning") {
        return part.text.trim().length > 0
      }
      return true
    }) ?? false

  return (
    <m.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="bg-fill-tertiary/60 border-border/60 dark:border-border/40 relative mx-auto flex w-full max-w-3xl flex-col gap-4 overflow-hidden rounded-3xl border p-7 text-left shadow-lg backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AISpline />
            <div className="flex flex-col">
              <span className="text-text text-base font-semibold">{heading}</span>
              <span className="text-text-secondary text-xs">
                {isLoading ? generatingLabel : undefined}
              </span>
            </div>
          </div>
          {isLoading && (
            <i className="i-mgc-loading-3-cute-re text-text-secondary size-5 animate-spin" />
          )}
        </div>

        <div className="text-text flex select-text flex-col gap-2 text-sm leading-6">
          {isError ? (
            <p className="text-text text-sm font-medium">{errorLabel}</p>
          ) : hasContent && message ? (
            <AIMessageParts message={message} isLastMessage={isLoading} />
          ) : (
            <p className="text-text-secondary text-sm">{emptyLabel}</p>
          )}
        </div>

        {isError && summary.error && <p className="text-text-secondary text-xs">{summary.error}</p>}
      </div>
    </m.div>
  )
}
