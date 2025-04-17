import { isMobile } from "@follow/components/hooks/useMobile.js"
import { FeedViewType, UserRole, views } from "@follow/constants"
import { IN_ELECTRON } from "@follow/shared/constants"
import { useMemo } from "react"

import { useShowAISummaryAuto, useShowAISummaryOnce } from "~/atoms/ai-summary"
import { useShowAITranslationAuto, useShowAITranslationOnce } from "~/atoms/ai-translation"
import {
  getReadabilityContent,
  getReadabilityStatus,
  ReadabilityStatus,
  setReadabilityContent,
  setReadabilityStatus,
  useEntryIsInReadability,
} from "~/atoms/readability"
import { useShowSourceContent } from "~/atoms/source-content"
import { useUserRole, whoami } from "~/atoms/user"
import { shortcuts } from "~/constants/shortcuts"
import { apiClient } from "~/lib/api-fetch"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { useRunCommandFn } from "~/modules/command/hooks/use-command"
import type { FollowCommandId } from "~/modules/command/types"
import { useToolbarOrderMap } from "~/modules/customize-toolbar/hooks"
import { useEntry } from "~/store/entry"
import { useFeedById } from "~/store/feed"
import { useInboxById } from "~/store/inbox"

import { useRouteParamsSelector } from "./useRouteParams"

export const toggleEntryReadability = async ({ id, url }: { id: string; url: string }) => {
  const status = getReadabilityStatus()[id]
  const isTurnOn = status !== ReadabilityStatus.INITIAL && !!status

  if (!isTurnOn && url) {
    setReadabilityStatus({
      [id]: ReadabilityStatus.WAITING,
    })
    try {
      let data = getReadabilityContent()[id]

      if (!data) {
        const result = await apiClient.entries.readability.$get({ query: { id } })
        if (result.data) {
          data = result.data
        }
      }

      if (data) {
        const status = getReadabilityStatus()[id]
        if (status !== ReadabilityStatus.WAITING) return
        setReadabilityStatus({
          [id]: ReadabilityStatus.SUCCESS,
        })
        setReadabilityContent({
          [id]: data,
        })
      }
    } catch {
      setReadabilityStatus({
        [id]: ReadabilityStatus.FAILURE,
      })
    }
  } else {
    setReadabilityStatus({
      [id]: ReadabilityStatus.INITIAL,
    })
  }
}

export type EntryActionItem = {
  id: FollowCommandId
  onClick: () => void
  hide?: boolean
  shortcut?: string
  active?: boolean
  disabled?: boolean
  notice?: boolean
  entryId: string
}

function hasHTMLTags(text?: string | null): boolean {
  return /<[^>]+>/.test(text || "")
}

export const useEntryActions = ({
  entryId,
  view,
  compact,
}: {
  entryId: string
  view?: FeedViewType
  compact?: boolean
}) => {
  const entry = useEntry(entryId)
  const isEntryInReadability = useEntryIsInReadability(entry?.entries.id)
  const imageLength = entry?.entries.media?.filter((a) => a.type === "photo").length || 0
  const feed = useFeedById(entry?.feedId, (feed) => {
    return {
      type: feed.type,
      ownerUserId: feed.ownerUserId,
      id: feed.id,
    }
  })
  const listId = useRouteParamsSelector((s) => s.listId)
  const inList = !!listId
  const inbox = useInboxById(entry?.inboxId)
  const isInbox = !!inbox
  const isContentContainsHTMLTags = hasHTMLTags(entry?.entries.content)

  const isShowSourceContent = useShowSourceContent()
  const isShowAISummaryAuto = useShowAISummaryAuto(entry)
  const isShowAISummaryOnce = useShowAISummaryOnce()
  const isShowAITranslationAuto = useShowAITranslationAuto(entry)
  const isShowAITranslationOnce = useShowAITranslationOnce()

  const runCmdFn = useRunCommandFn()
  const hasEntry = !!entry

  const userRole = useUserRole()

  const actionConfigs: EntryActionItem[] = useMemo(() => {
    if (!hasEntry) return []
    return [
      {
        id: COMMAND_ID.integration.saveToEagle,
        onClick: runCmdFn(COMMAND_ID.integration.saveToEagle, [{ entryId }]),
      },
      {
        id: COMMAND_ID.integration.saveToReadwise,
        onClick: runCmdFn(COMMAND_ID.integration.saveToReadwise, [{ entryId }]),
      },
      {
        id: COMMAND_ID.integration.saveToInstapaper,
        onClick: runCmdFn(COMMAND_ID.integration.saveToInstapaper, [{ entryId }]),
      },
      {
        id: COMMAND_ID.integration.saveToObsidian,
        onClick: runCmdFn(COMMAND_ID.integration.saveToObsidian, [{ entryId }]),
      },
      {
        id: COMMAND_ID.integration.saveToOutline,
        onClick: runCmdFn(COMMAND_ID.integration.saveToOutline, [{ entryId }]),
      },
      {
        id: COMMAND_ID.integration.saveToReadeck,
        onClick: runCmdFn(COMMAND_ID.integration.saveToReadeck, [{ entryId }]),
      },
      {
        id: COMMAND_ID.integration.saveToCubox,
        onClick: runCmdFn(COMMAND_ID.integration.saveToCubox, [{ entryId }]),
      },
      {
        id: COMMAND_ID.entry.tip,
        onClick: runCmdFn(COMMAND_ID.entry.tip, [
          { entryId, feedId: feed?.id, userId: feed?.ownerUserId },
        ]),
        hide: isInbox || feed?.ownerUserId === whoami()?.id,
        shortcut: shortcuts.entry.tip.key,
      },
      {
        id: COMMAND_ID.entry.star,
        onClick: runCmdFn(COMMAND_ID.entry.star, [{ entryId, view }]),
        active: !!entry?.collections,
        shortcut: shortcuts.entry.toggleStarred.key,
      },
      {
        id: COMMAND_ID.entry.delete,
        onClick: runCmdFn(COMMAND_ID.entry.delete, [{ entryId }]),
        hide: !isInbox,
        shortcut: shortcuts.entry.copyLink.key,
      },
      {
        id: COMMAND_ID.entry.copyLink,
        onClick: runCmdFn(COMMAND_ID.entry.copyLink, [{ entryId }]),
        hide: !entry?.entries.url,
        shortcut: shortcuts.entry.copyLink.key,
      },
      {
        id: COMMAND_ID.entry.exportAsPDF,
        onClick: runCmdFn(COMMAND_ID.entry.exportAsPDF, [{ entryId }]),
      },
      {
        id: COMMAND_ID.entry.imageGallery,
        hide: imageLength <= 5,
        onClick: runCmdFn(COMMAND_ID.entry.imageGallery, [{ entryId }]),
      },
      {
        id: COMMAND_ID.entry.openInBrowser,
        hide: !entry?.entries.url,
        onClick: runCmdFn(COMMAND_ID.entry.openInBrowser, [{ entryId }]),
      },
      {
        id: COMMAND_ID.entry.viewSourceContent,
        onClick: runCmdFn(COMMAND_ID.entry.viewSourceContent, [{ entryId }]),
        hide: isMobile() || !entry?.entries.url,
        active: isShowSourceContent,
      },
      {
        id: COMMAND_ID.entry.toggleAISummary,
        onClick: runCmdFn(COMMAND_ID.entry.toggleAISummary, []),
        hide:
          isShowAISummaryAuto ||
          ([FeedViewType.SocialMedia, FeedViewType.Videos] as (number | undefined)[]).includes(
            entry?.view,
          ),
        active: isShowAISummaryOnce,
        disabled: userRole === UserRole.Trial,
      },
      {
        id: COMMAND_ID.entry.toggleAITranslation,
        onClick: runCmdFn(COMMAND_ID.entry.toggleAITranslation, []),
        hide:
          isShowAITranslationAuto ||
          ([FeedViewType.SocialMedia, FeedViewType.Videos] as (number | undefined)[]).includes(
            entry?.view,
          ),
        active: isShowAITranslationOnce,
        disabled: userRole === UserRole.Trial,
      },
      {
        id: COMMAND_ID.entry.share,
        onClick: runCmdFn(COMMAND_ID.entry.share, [{ entryId }]),
        hide: !entry?.entries.url || !("share" in navigator || IN_ELECTRON),
        shortcut: shortcuts.entry.share.key,
      },
      {
        id: COMMAND_ID.entry.read,
        onClick: runCmdFn(COMMAND_ID.entry.read, [{ entryId }]),
        hide: !hasEntry || !!entry.collections || !!inList,
        active: !!entry?.read,
        shortcut: shortcuts.entry.toggleRead.key,
      },
      {
        id: COMMAND_ID.entry.tts,
        onClick: runCmdFn(COMMAND_ID.entry.tts, [
          { entryId, entryContent: entry?.entries.content },
        ]),
        hide: !IN_ELECTRON || compact || !entry?.entries.content,
        shortcut: shortcuts.entry.tts.key,
      },
      {
        id: COMMAND_ID.entry.readability,
        onClick: runCmdFn(COMMAND_ID.entry.readability, [
          { entryId, entryUrl: entry?.entries.url },
        ]),
        hide:
          !!entry.settings?.readability ||
          compact ||
          (view && views[view]!.wideMode) ||
          !entry?.entries.url,
        active: isEntryInReadability,
        notice: !isContentContainsHTMLTags && !isEntryInReadability,
      },
      {
        id: COMMAND_ID.settings.customizeToolbar,
        onClick: runCmdFn(COMMAND_ID.settings.customizeToolbar, []),
      },
    ]
      .filter((config) => !config.hide)
      .map((config) => {
        return {
          ...config,
          entryId,
        }
      })
  }, [
    compact,
    entry?.collections,
    entry?.entries.content,
    entry?.entries.url,
    entry?.read,
    entry?.settings?.readability,
    entry?.view,
    entryId,
    isEntryInReadability,
    feed?.id,
    feed?.ownerUserId,
    hasEntry,
    imageLength,
    inList,
    isInbox,
    isShowAISummaryAuto,
    isShowAISummaryOnce,
    isShowAITranslationAuto,
    isShowAITranslationOnce,
    isShowSourceContent,
    isContentContainsHTMLTags,
    runCmdFn,
    userRole,
    view,
  ])

  return actionConfigs
}

export const useSortedEntryActions = ({
  entryId,
  view,
  compact,
}: {
  entryId: string
  view?: FeedViewType
  compact?: boolean
}) => {
  const entryActions = useEntryActions({ entryId, view, compact })
  const orderMap = useToolbarOrderMap()
  const mainAction = useMemo(
    () =>
      entryActions
        .filter((item) => {
          const order = orderMap.get(item.id)
          if (!order) return false
          return order.type === "main"
        })
        .sort((a, b) => {
          const orderA = orderMap.get(a.id)?.order || 0
          const orderB = orderMap.get(b.id)?.order || 0
          return orderA - orderB
        }),
    [entryActions, orderMap],
  )

  const moreAction = useMemo(
    () =>
      entryActions
        .filter((item) => {
          const order = orderMap.get(item.id)
          // If the order is not set, it should be in the "more" menu
          if (!order) return true
          return order.type !== "main"
        })
        // .filter((item) => item.id !== COMMAND_ID.settings.customizeToolbar)
        .sort((a, b) => {
          const orderA = orderMap.get(a.id)?.order || Infinity
          const orderB = orderMap.get(b.id)?.order || Infinity
          return orderA - orderB
        }),
    [entryActions, orderMap],
  )

  return {
    mainAction,
    moreAction,
  }
}
