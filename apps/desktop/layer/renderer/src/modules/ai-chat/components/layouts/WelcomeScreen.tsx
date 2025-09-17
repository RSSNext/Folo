import { Folo } from "@follow/components/icons/folo.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { FeedViewType } from "@follow/constants"
import { env } from "@follow/shared/env.desktop"
import { clsx } from "@follow/utils"
import type { UIMessageChunk } from "ai"
import { DefaultChatTransport } from "ai"
import type { EditorState, LexicalEditor } from "lexical"
import { AnimatePresence, m } from "motion/react"
import { startTransition, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { useAISettingValue } from "~/atoms/settings/ai"
import { ROUTE_ENTRY_PENDING } from "~/constants"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { AISpline } from "~/modules/ai-chat/components/3d-models/AISpline"

import { useAttachScrollBeyond } from "../../hooks/useAttachScrollBeyond"
import { useMainEntryId } from "../../hooks/useMainEntryId"
import { AIMarkdownStreamingMessage } from "../message/AIMarkdownMessage.v2"
import { DefaultWelcomeContent, EntrySummaryCard } from "../welcome"

type WelcomeTimelineSummaryStatus = "idle" | "loading" | "success" | "error"

interface WelcomeTimelineSummaryState {
  status: WelcomeTimelineSummaryStatus
  content: string
  error?: string
}

class TimelineSummaryTransport extends DefaultChatTransport<any> {
  public parseStream(stream: ReadableStream<Uint8Array>) {
    return this.processResponseStream(stream)
  }
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
    content: "",
  })

  const realEntryId = entryId === ROUTE_ENTRY_PENDING ? "" : entryId
  const isAllView = view === FeedViewType.All && isAllFeeds && !realEntryId

  const hasEntryContext = !!mainEntryId
  const enabledShortcuts = aiSettings.shortcuts?.filter((shortcut) => shortcut.enabled) || []
  const shouldFetchTimelineSummary = isAllView && !hasEntryContext

  useEffect(() => {
    if (!shouldFetchTimelineSummary) {
      setTimelineSummary({ status: "idle", content: "", error: undefined })
      return
    }

    const controller = new AbortController()
    let isCancelled = false
    let reader: ReadableStreamDefaultReader<UIMessageChunk> | null = null

    const transport = new TimelineSummaryTransport()

    const fetchTimelineSummary = async () => {
      setTimelineSummary({ status: "loading", content: "", error: undefined })

      const url = `${env.VITE_API_URL}/ai/timeline-summary`

      try {
        const response = await fetch(url, {
          credentials: "include",
          method: "GET",
        })

        if (!response.ok) {
          const message = await response.text()
          throw new Error(message || `Timeline summary request failed (${response.status})`)
        }

        if (!response.body) {
          throw new Error("Timeline summary response is empty")
        }

        const stream = transport.parseStream(response.body)
        reader = stream.getReader()
        const activeTextIds = new Set<string>()

        while (!isCancelled) {
          const { done, value } = await reader.read()
          if (done) break
          if (!value) continue

          switch (value.type) {
            case "text-start": {
              activeTextIds.add(value.id)
              break
            }
            case "text-delta": {
              if (activeTextIds.has(value.id) && typeof value.delta === "string" && value.delta) {
                const { delta } = value
                startTransition(() => {
                  setTimelineSummary((prev) => ({
                    ...prev,
                    content: prev.content + delta,
                  }))
                })
              }
              break
            }
            case "text-end": {
              activeTextIds.delete(value.id)
              break
            }
            case "error":
            case "tool-output-error": {
              const errorText =
                value.type === "error"
                  ? value.errorText
                  : (value as { errorText: string }).errorText
              throw new Error(errorText)
            }
            default: {
              const maybeText =
                (value as { delta?: string; text?: string }).delta ??
                (value as { text?: string }).text
              if (typeof maybeText === "string" && maybeText) {
                startTransition(() => {
                  setTimelineSummary((prev) => ({
                    ...prev,
                    content: prev.content + maybeText,
                  }))
                })
              }
              break
            }
          }
        }

        if (!isCancelled) {
          setTimelineSummary((prev) => ({ ...prev, status: "success" }))
        }
      } catch (error) {
        if (controller.signal.aborted || isCancelled) {
          return
        }

        console.error("Failed to fetch timeline summary", error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        setTimelineSummary((prev) => ({
          status: "error",
          content: prev.content,
          error: errorMessage,
        }))
      } finally {
        if (reader) {
          reader.cancel().catch(() => {})
          reader = null
        }
      }
    }

    fetchTimelineSummary()

    return () => {
      isCancelled = true
      controller.abort()
      if (reader) {
        reader.cancel().catch(() => {})
        reader = null
      }
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
  const hasContent = summary.content.trim().length > 0

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

        <div className="text-text prose dark:prose-invert max-w-none text-sm leading-6">
          {isError ? (
            <p className="text-text text-sm font-medium">{errorLabel}</p>
          ) : hasContent ? (
            <AIMarkdownStreamingMessage text={summary.content} isStreaming={isLoading} />
          ) : (
            <p className="text-text-secondary text-sm">{emptyLabel}</p>
          )}
        </div>

        {isError && summary.error && <p className="text-text-secondary text-xs">{summary.error}</p>}
      </div>
    </m.div>
  )
}
