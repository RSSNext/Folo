import { FeedViewType } from "@follow/constants"
import { DEFAULT_SUMMARIZE_TIMELINE_SHORTCUT_ID } from "@follow/shared/settings/defaults"
import { getCategoryFeedIds } from "@follow/store/subscription/getter"
import { nanoid } from "nanoid"
import { useEffect, useMemo, useRef } from "react"

import { useAISettingValue } from "~/atoms/settings/ai"
import { ROUTE_ENTRY_PENDING, ROUTE_FEED_IN_FOLDER, ROUTE_FEED_PENDING } from "~/constants"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"

import { AI_CHAT_SPECIAL_ID_PREFIX } from "../constants"
import { AIPersistService } from "../services"
import { useBlockActions, useChatActions, useCurrentChatId } from "../store/hooks"
import { BlockSliceAction } from "../store/slices/block.slice"
import type { AIChatContextBlock, SendingUIMessage } from "../store/types"
import { getEditorStateJSONString } from "../utils/lexical-markdown"

const ONE_HOUR = 60 * 60 * 1000

const buildSummaryMessage = (
  prompt: string,
  contextBlocks: AIChatContextBlock[],
  messageId: string,
): SendingUIMessage => {
  const parts: SendingUIMessage["parts"] = []

  if (contextBlocks.length > 0) {
    parts.push({
      type: "data-block",
      data: contextBlocks,
    })
  }

  parts.push({
    type: "data-rich-text",
    data: {
      state: getEditorStateJSONString(prompt),
      text: prompt,
    },
  })

  return {
    id: messageId,
    role: "user",
    parts,
  }
}

const buildTimelineSummaryChatId = ({
  view,
  feedId,
  timelineId,
  seed,
}: {
  view: number
  feedId: string
  timelineId?: string | null
  seed: string
}) => {
  const normalizedTimelineId = timelineId ?? "all"
  const prefix = AI_CHAT_SPECIAL_ID_PREFIX.TIMELINE_SUMMARY
  return `${prefix}${view}:${feedId}:${normalizedTimelineId}:${seed}`
}

export const useAutoTimelineSummaryShortcut = () => {
  const aiSettings = useAISettingValue()

  const { view, feedId, entryId, timelineId } = useRouteParamsSelector((params) => ({
    view: params.view,
    feedId: params.feedId,
    entryId: params.entryId,
    timelineId: params.timelineId,
  }))

  const chatActions = useChatActions()
  const blockActions = useBlockActions()
  const currentChatId = useCurrentChatId()

  const automationStateRef = useRef<{
    contextKey: string | null
    promise: Promise<void> | null
    failed: boolean
  }>({
    contextKey: null,
    promise: null,
    failed: false,
  })

  const isEntryFocused = entryId && entryId !== ROUTE_ENTRY_PENDING
  const isAllTimeline = view === FeedViewType.All && !isEntryFocused

  const defaultShortcut = useMemo(() => {
    const shortcuts = aiSettings.shortcuts ?? []
    return shortcuts.find(
      (shortcut) =>
        shortcut.id === DEFAULT_SUMMARIZE_TIMELINE_SHORTCUT_ID &&
        shortcut.enabled &&
        shortcut.prompt,
    )
  }, [aiSettings.shortcuts])

  const normalizedFeedId = feedId ?? ROUTE_FEED_PENDING

  const contextKey = useMemo(() => {
    if (!isAllTimeline) return null
    const keyParts = [`timeline:${timelineId ?? "all"}`, `feed:${normalizedFeedId}`]
    return keyParts.join("|")
  }, [isAllTimeline, timelineId, normalizedFeedId])

  const contextBlocks = useMemo<AIChatContextBlock[]>(() => {
    if (!isAllTimeline) return []

    const blocks: AIChatContextBlock[] = []

    if (normalizedFeedId && normalizedFeedId !== ROUTE_FEED_PENDING) {
      let value = normalizedFeedId
      if (normalizedFeedId.startsWith(ROUTE_FEED_IN_FOLDER)) {
        const categoryName = normalizedFeedId.slice(ROUTE_FEED_IN_FOLDER.length)
        const ids = getCategoryFeedIds(categoryName, FeedViewType.All)
        if (ids.length > 0) {
          value = ids.join(",")
        }
      }

      blocks.push({
        id: BlockSliceAction.SPECIAL_TYPES.mainFeed,
        type: "mainFeed",
        value,
      })
    }

    return blocks
  }, [isAllTimeline, normalizedFeedId])

  useEffect(() => {
    if (!contextKey || !defaultShortcut) {
      if (!contextKey) {
        automationStateRef.current = { contextKey: null, promise: null, failed: false }
      }
      return
    }

    if (automationStateRef.current.contextKey !== contextKey) {
      automationStateRef.current = {
        contextKey,
        promise: null,
        failed: false,
      }
    } else {
      if (automationStateRef.current.promise) {
        return
      }
      if (automationStateRef.current.failed) {
        return
      }
    }

    const run = async () => {
      try {
        const prompt = defaultShortcut.prompt.trim()
        if (!prompt) {
          return
        }

        const existingSession = await AIPersistService.findTimelineSummarySession({
          view,
          feedId: normalizedFeedId,
          timelineId: timelineId ?? null,
        })
        const now = Date.now()

        if (existingSession) {
          const lastUpdatedAt = existingSession.updatedAt?.getTime?.() ?? existingSession.updatedAt
          if (typeof lastUpdatedAt === "number" && now - lastUpdatedAt < ONE_HOUR) {
            if (currentChatId !== existingSession.chatId) {
              await chatActions.switchToChat(existingSession.chatId)
            }
            automationStateRef.current.failed = false
            return
          }
        }

        const timelineSummaryChatId = buildTimelineSummaryChatId({
          view,
          feedId: normalizedFeedId,
          timelineId: timelineId ?? null,
          seed: nanoid(6),
        })

        await AIPersistService.ensureSession(timelineSummaryChatId, {
          title: "Timeline Summary",
        })

        await chatActions.switchToChat(timelineSummaryChatId)
        blockActions.clearBlocks({ keepSpecialTypes: true })

        const message = buildSummaryMessage(prompt, contextBlocks, nanoid())

        await chatActions.sendMessage(message, {
          body: { scene: "general" },
        })

        automationStateRef.current.failed = false
      } catch (error) {
        automationStateRef.current.failed = true
        console.error("[AI Chat] Failed to auto-run timeline summary shortcut:", error)
      } finally {
        if (automationStateRef.current.contextKey === contextKey) {
          automationStateRef.current.promise = null
        }
      }
    }

    const promise = run()
    automationStateRef.current.promise = promise
  }, [
    blockActions,
    chatActions,
    contextBlocks,
    contextKey,
    currentChatId,
    defaultShortcut,
    normalizedFeedId,
    timelineId,
    view,
  ])
}
