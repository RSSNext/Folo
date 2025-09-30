import { Folo } from "@follow/components/icons/folo.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { FeedViewType } from "@follow/constants"
import { useElementWidth } from "@follow/hooks"
import { clsx } from "@follow/utils"
import type { EditorState, LexicalEditor } from "lexical"
import { AnimatePresence, m } from "motion/react"
import { useEffect, useMemo, useRef } from "react"
import { getI18n, useTranslation } from "react-i18next"

import { useAISettingValue } from "~/atoms/settings/ai"
import { ROUTE_ENTRY_PENDING } from "~/constants"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { AISpline } from "~/modules/ai-chat/components/3d-models/AISpline"

import { AI_CHAT_SPECIAL_ID_PREFIX } from "../../constants"
import { useAttachScrollBeyond } from "../../hooks/useAttachScrollBeyond"
import { useMainEntryId } from "../../hooks/useMainEntryId"
import { AIPersistService } from "../../services"
import { useChatActions, useChatError, useChatStatus, useMessages } from "../../store/hooks"
import { AIMessageParts } from "../message/AIMessageParts"
import { DefaultWelcomeContent, EntrySummaryCard } from "../welcome"
import { AIChatRoot } from "./AIChatRoot"

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

  const realEntryId = entryId === ROUTE_ENTRY_PENDING ? "" : entryId
  const isAllView = view === FeedViewType.All && isAllFeeds && !realEntryId

  const hasEntryContext = !!mainEntryId
  const enabledShortcuts = aiSettings.shortcuts?.filter((shortcut) => shortcut.enabled) || []
  const shouldFetchTimelineSummary = isAllView && !hasEntryContext

  const { handleScroll } = useAttachScrollBeyond()
  const showTimelineSummary = shouldFetchTimelineSummary

  const todayTimelineSummaryId = useMemo(() => {
    const now = new Date()

    const day = now.getDate()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    return `${AI_CHAT_SPECIAL_ID_PREFIX}${year}-${month}-${day}`
  }, [])

  const status = useChatStatus()
  const { setCurrentTitle, getCurrentTitle } = useChatActions()

  const onceRef = useRef(false)
  useEffect(() => {
    if (!onceRef.current && !getCurrentTitle()) {
      onceRef.current = true
      const title = t("timeline.summary.title_template", {
        date: Intl.DateTimeFormat(getI18n().language, {
          dateStyle: "short",
        }).format(),
      })
      setCurrentTitle(title)
      AIPersistService.updateSessionTitle(todayTimelineSummaryId, title)
    }
  }, [getCurrentTitle, setCurrentTitle, status, t, todayTimelineSummaryId])
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
          <AIChatRoot chatId={todayTimelineSummaryId} generateId={() => todayTimelineSummaryId}>
            <TimelineSummarySection />
          </AIChatRoot>
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

const TimelineSummarySection = () => {
  const { getChatInstance } = useChatActions()

  const status = useChatStatus()
  const error = useChatError()
  const onceRef = useRef(false)
  const messages = useMessages()
  useEffect(() => {
    if (onceRef.current) return
    onceRef.current = true
    let isCancelled = false
    const fetchTimelineSummary = async () => {
      if (isCancelled) return

      await getChatInstance().sendMessage(undefined, {
        body: { scene: "timeline-summary" },
      })
    }

    fetchTimelineSummary()

    return () => {
      isCancelled = true
    }
  }, [getChatInstance])

  const message = messages.at(-1)

  const hasContent =
    message?.parts.some((part) => {
      if (part.type === "text" || part.type === "reasoning") {
        return part.text.trim().length > 0
      }
      return true
    }) ?? false

  const { t } = useTranslation("ai")

  const messageContainerRef = useRef<HTMLDivElement>(null)
  const messageContainerWidth = useElementWidth(messageContainerRef)

  const isLoading = status === "streaming"
  const isError = status === "error"
  return (
    <m.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="bg-material-ultra-thin border-border relative mx-auto flex w-full max-w-3xl flex-col gap-4 overflow-hidden rounded-2xl border p-7 text-left shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AISpline />
            <div className="flex flex-col">
              <span className="text-text text-base font-semibold">
                {t("timeline_summary.heading")}
              </span>
              <span className="text-text-secondary text-xs">
                {isLoading ? t("timeline_summary.generating") : undefined}
              </span>
            </div>
          </div>
          {isLoading && (
            <i className="i-mgc-loading-3-cute-re text-text-secondary size-5 animate-spin" />
          )}
        </div>

        <div
          className="text-text flex select-text flex-col gap-2 text-sm leading-6"
          ref={messageContainerRef}
          style={
            {
              "--ai-chat-message-container-width": `${messageContainerWidth}px`,
              opacity: messageContainerWidth > 0 ? 1 : 0,
            } as React.CSSProperties
          }
        >
          {isError ? (
            <p className="text-text text-sm font-medium">{t("timeline_summary.error")}</p>
          ) : hasContent && message ? (
            <AIMessageParts message={message} isLastMessage={isLoading} />
          ) : (
            <p className="text-text-secondary text-sm">{t("timeline_summary.empty")}</p>
          )}
        </div>

        {isError && error && <p className="text-text-secondary text-xs">{error.message}</p>}
      </div>
    </m.div>
  )
}
