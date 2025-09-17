import { Folo } from "@follow/components/icons/folo.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { FeedViewType } from "@follow/constants"
import { env } from "@follow/shared/env.desktop"
import { clsx } from "@follow/utils"
import { DefaultChatTransport, readUIMessageStream } from "ai"
import type { EditorState, LexicalEditor } from "lexical"
import { AnimatePresence, m } from "motion/react"
import { startTransition, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { useAISettingValue } from "~/atoms/settings/ai"
import { ROUTE_ENTRY_PENDING } from "~/constants"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { getAIModelState } from "~/modules/ai-chat/atoms/session"
import { AISpline } from "~/modules/ai-chat/components/3d-models/AISpline"
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

    const abortController = new AbortController()
    let isCancelled = false
    let lastMessage: BizUIMessage = {
      id: "timeline-summary",
      role: "assistant",
      parts: [],
    }

    setTimelineSummary({
      status: "loading",
      message: lastMessage,
      error: undefined,
    })

    const transport = new DefaultChatTransport<BizUIMessage>({
      api: `${env.VITE_API_URL}/ai/timeline-summary`,
      credentials: "include",
      body: () => {
        const { selectedModel } = getAIModelState()
        return selectedModel ? { model: selectedModel } : {}
      },
    })

    const fetchTimelineSummary = async () => {
      let encounteredError = false

      try {
        const stream = await transport.sendMessages({
          chatId: "timeline-summary",
          messages: [],
          trigger: "submit-message",
          messageId: undefined,
          abortSignal: abortController.signal,
        })

        const messageStream = readUIMessageStream<BizUIMessage>({
          message: lastMessage,
          stream,
          terminateOnError: true,
        })

        for await (const message of messageStream) {
          if (isCancelled || abortController.signal.aborted) {
            break
          }

          lastMessage = message
          startTransition(() => {
            setTimelineSummary({
              status: "loading",
              message,
              error: undefined,
            })
          })
        }
      } catch (error) {
        if (abortController.signal.aborted || isCancelled) {
          return
        }

        encounteredError = true
        console.error("Failed to fetch timeline summary", error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        setTimelineSummary({
          status: "error",
          message: lastMessage,
          error: errorMessage,
        })
      } finally {
        if (!encounteredError && !isCancelled && !abortController.signal.aborted) {
          startTransition(() => {
            setTimelineSummary({
              status: "success",
              message: lastMessage,
              error: undefined,
            })
          })
        }
      }
    }

    fetchTimelineSummary()

    return () => {
      isCancelled = true
      abortController.abort()
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
