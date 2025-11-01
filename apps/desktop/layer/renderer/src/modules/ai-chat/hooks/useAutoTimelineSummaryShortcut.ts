import { convertLexicalToMarkdown } from "@follow/components/ui/lexical-rich-editor/utils.js"
import { FeedViewType } from "@follow/constants"
import { DEFAULT_SUMMARIZE_TIMELINE_SHORTCUT_ID } from "@follow/shared/settings/defaults"
import { getCategoryFeedIds } from "@follow/store/subscription/getter"
import type { LexicalEditor } from "lexical"
import { $createParagraphNode, $getRoot, createEditor } from "lexical"
import { nanoid } from "nanoid"
import { useEffect, useMemo, useRef } from "react"

import { getShortcutEffectivePrompt, useAISettingValue } from "~/atoms/settings/ai"
import { useGeneralSettingKey } from "~/atoms/settings/general"
import { ROUTE_FEED_IN_FOLDER, ROUTE_FEED_PENDING } from "~/constants"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"

import { AI_CHAT_SPECIAL_ID_PREFIX } from "../constants"
import { LexicalAIEditorNodes, ShortcutNode } from "../editor"
import { AIPersistService } from "../services"
import { useAIChatStore } from "../store/AIChatContext"
import { useBlockActions, useChatActions, useCurrentChatId } from "../store/hooks"
import { BlockSliceAction } from "../store/slices/block.slice"
import type { AIChatContextBlock, SendingUIMessage } from "../store/types"
import { isTimelineSummaryAutoContext } from "./useTimelineSummaryAutoContext"

const INTERVAL = 5 * 60 * 60 * 1000

const buildSummaryMessage = (
  editor: LexicalEditor,
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
      state: JSON.stringify(editor.getEditorState().toJSON()),
      text: convertLexicalToMarkdown(editor),
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
  unreadOnly,
  seed,
}: {
  view: number
  feedId: string
  timelineId?: string | null
  unreadOnly: boolean
  seed: string
}) => {
  const normalizedTimelineId = timelineId ?? "all"
  const unreadSegment = unreadOnly ? "unread" : "all"
  const prefix = AI_CHAT_SPECIAL_ID_PREFIX.TIMELINE_SUMMARY
  return `${prefix}${view}:${feedId}:${normalizedTimelineId}:${unreadSegment}:${seed}`
}

export const useAutoTimelineSummaryShortcut = () => {
  const aiSettings = useAISettingValue()
  const unreadOnly = useGeneralSettingKey("unreadOnly")

  const { view, feedId, entryId, timelineId } = useRouteParamsSelector((params) => ({
    view: params.view,
    feedId: params.feedId,
    entryId: params.entryId,
    timelineId: params.timelineId,
  }))

  const chatActions = useChatActions()
  const blockActions = useBlockActions()
  const currentChatId = useCurrentChatId()
  const timelineSummaryManualOverride = useAIChatStore()(
    (state) => state.timelineSummaryManualOverride,
  )

  const automationStateRef = useRef<{
    contextKey: string | null
    promise: Promise<void> | null
    failed: boolean
  }>({
    contextKey: null,
    promise: null,
    failed: false,
  })
  const previousContextKeyRef = useRef<string | null>(null)

  const isAllTimeline = isTimelineSummaryAutoContext({ view, feedId, entryId })

  const defaultShortcut = useMemo(() => {
    const shortcuts = aiSettings.shortcuts ?? []
    return shortcuts.find(
      (shortcut) => shortcut.id === DEFAULT_SUMMARIZE_TIMELINE_SHORTCUT_ID && shortcut.enabled,
    )
  }, [aiSettings.shortcuts])

  const normalizedFeedId = feedId ?? ROUTE_FEED_PENDING

  const contextKey = useMemo(() => {
    if (!isAllTimeline) return null
    const keyParts = [
      `timeline:${timelineId ?? "all"}`,
      `feed:${normalizedFeedId}`,
      `unread:${unreadOnly ? "1" : "0"}`,
    ]
    return keyParts.join("|")
  }, [isAllTimeline, timelineId, normalizedFeedId, unreadOnly])

  useEffect(() => {
    if (previousContextKeyRef.current !== contextKey) {
      chatActions.setTimelineSummaryManualOverride(false)
      previousContextKeyRef.current = contextKey
    }
  }, [chatActions, contextKey])

  const previousIsAllTimelineRef = useRef(isAllTimeline)

  useEffect(() => {
    const wasAllTimeline = previousIsAllTimelineRef.current
    if (
      wasAllTimeline &&
      !isAllTimeline &&
      currentChatId &&
      currentChatId.startsWith(AI_CHAT_SPECIAL_ID_PREFIX.TIMELINE_SUMMARY)
    ) {
      blockActions.clearBlocks({ keepSpecialTypes: true })
      chatActions.newChat()
    }
    previousIsAllTimelineRef.current = isAllTimeline
  }, [blockActions, chatActions, currentChatId, isAllTimeline])

  const contextBlocks = useMemo<AIChatContextBlock[]>(() => {
    if (!isAllTimeline) return []

    const blocks: AIChatContextBlock[] = []

    if (typeof view === "number") {
      blocks.push({
        id: BlockSliceAction.SPECIAL_TYPES.mainView,
        type: "mainView",
        value: `${view}`,
      })
    }

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

    if (unreadOnly) {
      blocks.push({
        id: BlockSliceAction.SPECIAL_TYPES.unreadOnly,
        type: "unreadOnly",
        value: "true",
      })
    }

    return blocks
  }, [isAllTimeline, normalizedFeedId, unreadOnly, view])

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

    if (timelineSummaryManualOverride) {
      return
    }

    const run = async () => {
      try {
        const prompt = getShortcutEffectivePrompt(defaultShortcut)
        const { id, name } = defaultShortcut

        const existingSession = await AIPersistService.findTimelineSummarySession({
          view,
          feedId: normalizedFeedId,
          timelineId: timelineId ?? null,
          unreadOnly,
        })
        const now = Date.now()

        if (existingSession) {
          const lastUpdatedAt = existingSession.updatedAt?.getTime?.() ?? existingSession.updatedAt
          if (typeof lastUpdatedAt === "number" && now - lastUpdatedAt < INTERVAL) {
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
          unreadOnly,
          seed: nanoid(6),
        })

        await AIPersistService.ensureSession(timelineSummaryChatId, {
          title: "Timeline Summary",
        })

        await chatActions.switchToChat(timelineSummaryChatId)
        blockActions.clearBlocks({ keepSpecialTypes: true })

        const tempEditor = createEditor({
          nodes: LexicalAIEditorNodes,
        })

        tempEditor.update(
          () => {
            const root = $getRoot()
            root.clear()
            const paragraph = $createParagraphNode()
            const shortcutNode = new ShortcutNode({ id, name, prompt })
            paragraph.append(shortcutNode)
            root.append(paragraph)
          },
          {
            discrete: true,
          },
        )

        const message = buildSummaryMessage(tempEditor, contextBlocks, nanoid())

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
    unreadOnly,
    view,
    timelineSummaryManualOverride,
  ])
}
