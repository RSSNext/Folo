import { isMobile } from "@follow/components/hooks/useMobile.js"
import { FeedViewType, UserRole, views } from "@follow/constants"
import { IN_ELECTRON } from "@follow/shared/constants"
import { useMemo } from "react"

import { useShowAISummaryAuto, useShowAISummaryOnce } from "~/atoms/ai-summary"
import { useShowAITranslationAuto, useShowAITranslationOnce } from "~/atoms/ai-translation"
import { MENU_ITEM_SEPARATOR, MenuItemSeparator, MenuItemText } from "~/atoms/context-menu"
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
import { tipcClient } from "~/lib/client"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { getCommand, useRunCommandFn } from "~/modules/command/hooks/use-command"
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
      const result = await tipcClient?.readability({ url })
      if (result) {
        setReadabilityContent({
          [id]: result,
        })
        setReadabilityStatus({
          [id]: ReadabilityStatus.SUCCESS,
        })
      } else {
        setReadabilityStatus({
          [id]: ReadabilityStatus.FAILURE,
        })
      }
    }
  } else {
    setReadabilityStatus({
      [id]: ReadabilityStatus.INITIAL,
    })
  }
}

interface EntryActionMenuItemConfig {
  id: FollowCommandId
  onClick: () => void
  hide?: boolean
  shortcut?: string
  active?: boolean
  disabled?: boolean
  notice?: boolean
  entryId: string
}

export class EntryActionMenuItem extends MenuItemText {
  protected privateConfig: EntryActionMenuItemConfig

  constructor(config: EntryActionMenuItemConfig) {
    const cmd = getCommand(config.id) || null
    super({
      ...config,
      label: cmd?.label.title || "",
      click: () => config.onClick?.(),
      hide: !cmd || config.hide,
    })

    this.privateConfig = config
  }

  public get id() {
    return this.privateConfig.id
  }

  public get active() {
    return this.privateConfig.active
  }

  public get notice() {
    return this.privateConfig.notice
  }

  public get entryId() {
    return this.privateConfig.entryId
  }

  public override extend(config: Partial<EntryActionMenuItemConfig>) {
    return new EntryActionMenuItem({
      ...this.privateConfig,
      ...config,
    })
  }
}
export type EntryActionItem = EntryActionMenuItem | MenuItemSeparator

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
      siteUrl: feed.siteUrl,
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

    const configs: EntryActionItem[] = [
      new EntryActionMenuItem({
        id: COMMAND_ID.integration.saveToEagle,
        onClick: runCmdFn(COMMAND_ID.integration.saveToEagle, [{ entryId }]),
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.integration.saveToReadwise,
        onClick: runCmdFn(COMMAND_ID.integration.saveToReadwise, [{ entryId }]),
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.integration.saveToInstapaper,
        onClick: runCmdFn(COMMAND_ID.integration.saveToInstapaper, [{ entryId }]),
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.integration.saveToObsidian,
        onClick: runCmdFn(COMMAND_ID.integration.saveToObsidian, [{ entryId }]),
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.integration.saveToOutline,
        onClick: runCmdFn(COMMAND_ID.integration.saveToOutline, [{ entryId }]),
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.integration.saveToReadeck,
        onClick: runCmdFn(COMMAND_ID.integration.saveToReadeck, [{ entryId }]),
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.integration.saveToCubox,
        onClick: runCmdFn(COMMAND_ID.integration.saveToCubox, [{ entryId }]),
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.integration.saveToZotero,
        onClick: runCmdFn(COMMAND_ID.integration.saveToZotero, [{ entryId }]),
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.tip,
        onClick: runCmdFn(COMMAND_ID.entry.tip, [
          { entryId, feedId: feed?.id, userId: feed?.ownerUserId },
        ]),
        hide: isInbox || feed?.ownerUserId === whoami()?.id,
        shortcut: shortcuts.entry.tip.key,
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.star,
        onClick: runCmdFn(COMMAND_ID.entry.star, [{ entryId, view }]),
        active: !!entry?.collections,
        shortcut: shortcuts.entry.toggleStarred.key,
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.copyTitle,
        onClick: runCmdFn(COMMAND_ID.entry.copyTitle, [{ entryId }]),
        shortcut: shortcuts.entry.copyTitle.key,
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.copyLink,
        onClick: runCmdFn(COMMAND_ID.entry.copyLink, [{ entryId }]),
        hide: !entry?.entries.url,
        shortcut: shortcuts.entry.copyLink.key,
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.exportAsPDF,
        onClick: runCmdFn(COMMAND_ID.entry.exportAsPDF, [{ entryId }]),
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.imageGallery,
        hide: imageLength <= 5,
        onClick: runCmdFn(COMMAND_ID.entry.imageGallery, [{ entryId }]),
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.openInBrowser,
        hide: !entry?.entries.url,
        onClick: runCmdFn(COMMAND_ID.entry.openInBrowser, [{ entryId }]),
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.viewSourceContent,
        onClick: runCmdFn(COMMAND_ID.entry.viewSourceContent, [
          { entryId, siteUrl: feed?.siteUrl },
        ]),
        hide: isMobile() || !entry?.entries.url,
        active: isShowSourceContent,
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.toggleAISummary,
        onClick: runCmdFn(COMMAND_ID.entry.toggleAISummary, []),
        hide:
          isShowAISummaryAuto ||
          ([FeedViewType.SocialMedia, FeedViewType.Videos] as (number | undefined)[]).includes(
            entry?.view,
          ),
        active: isShowAISummaryOnce,
        disabled: userRole === UserRole.Trial,
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.toggleAITranslation,
        onClick: runCmdFn(COMMAND_ID.entry.toggleAITranslation, []),
        hide:
          isShowAITranslationAuto ||
          ([FeedViewType.SocialMedia, FeedViewType.Videos] as (number | undefined)[]).includes(
            entry?.view,
          ),
        active: isShowAITranslationOnce,
        disabled: userRole === UserRole.Trial,
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.share,
        onClick: runCmdFn(COMMAND_ID.entry.share, [{ entryId }]),
        hide: !entry?.entries.url || !("share" in navigator || IN_ELECTRON),
        shortcut: shortcuts.entry.share.key,
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.readAbove,
        onClick: runCmdFn(COMMAND_ID.entry.readAbove, [{ publishedAt: entry.entries.publishedAt }]),
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.read,
        onClick: runCmdFn(COMMAND_ID.entry.read, [{ entryId }]),
        hide: !hasEntry || !!entry.collections || !!inList,
        active: !!entry?.read,
        shortcut: shortcuts.entry.toggleRead.key,
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.readBelow,
        onClick: runCmdFn(COMMAND_ID.entry.readBelow, [{ publishedAt: entry.entries.publishedAt }]),
        entryId,
      }),
      MENU_ITEM_SEPARATOR,
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.delete,
        onClick: runCmdFn(COMMAND_ID.entry.delete, [{ entryId }]),
        hide: !isInbox,
        entryId,
      }),

      new EntryActionMenuItem({
        id: COMMAND_ID.entry.tts,
        onClick: runCmdFn(COMMAND_ID.entry.tts, [
          // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
          { entryId, entryContent: entry?.entries.content! },
        ]),
        hide: !IN_ELECTRON || compact || !entry?.entries.content,
        shortcut: shortcuts.entry.tts.key,
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.readability,
        onClick: runCmdFn(COMMAND_ID.entry.readability, [
          // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
          { entryId, entryUrl: entry?.entries.url! },
        ]),
        hide:
          !!entry.settings?.readability ||
          compact ||
          (view && views[view]!.wideMode) ||
          !entry?.entries.url,
        active: isEntryInReadability,
        notice: !isContentContainsHTMLTags && !isEntryInReadability,
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.settings.customizeToolbar,
        onClick: runCmdFn(COMMAND_ID.settings.customizeToolbar, []),
        entryId,
      }),
    ].filter((config) => {
      if (config === MENU_ITEM_SEPARATOR) {
        return config
      }

      return !config.hide
    })

    return configs
  }, [
    compact,
    entry?.collections,
    entry?.entries.content,
    entry?.entries.publishedAt,
    entry?.entries.url,
    entry?.read,
    entry?.settings?.readability,
    entry?.view,
    entryId,
    isEntryInReadability,
    feed?.id,
    feed?.ownerUserId,
    feed?.siteUrl,
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
          if (item === MENU_ITEM_SEPARATOR || item instanceof MenuItemSeparator) {
            return false
          }
          const order = orderMap.get(item.id)

          if (!order) return false
          return order.type === "main"
        })
        .sort((a, b) => {
          if (a instanceof MenuItemSeparator || b instanceof MenuItemSeparator) {
            return 0
          }
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
          if (item instanceof MenuItemSeparator) {
            return false
          }
          const order = orderMap.get(item.id)
          if (!order) return false
          return order.type !== "main"
        })
        // .filter((item) => item.id !== COMMAND_ID.settings.customizeToolbar)
        .sort((a, b) => {
          if (a instanceof MenuItemSeparator || b instanceof MenuItemSeparator) {
            return 0
          }
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
