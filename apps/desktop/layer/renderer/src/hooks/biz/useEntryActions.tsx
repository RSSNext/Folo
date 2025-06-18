import { isMobile } from "@follow/components/hooks/useMobile.js"
import { FeedViewType, UserRole, views } from "@follow/constants"
import { IN_ELECTRON } from "@follow/shared/constants"
import { useIsEntryStarred } from "@follow/store/collection/hooks"
import { getEntry } from "@follow/store/entry/getter"
import { useEntry } from "@follow/store/entry/hooks"
import { entrySyncServices } from "@follow/store/entry/store"
import type { EntryModel } from "@follow/store/entry/types"
import { useFeedById } from "@follow/store/feed/hooks"
import { useIsInbox } from "@follow/store/inbox/hooks"
import { doesTextContainHTML } from "@follow/utils/utils"
import { useMemo } from "react"

import { useShowAISummaryAuto, useShowAISummaryOnce } from "~/atoms/ai-summary"
import { useShowAITranslationAuto, useShowAITranslationOnce } from "~/atoms/ai-translation"
import { MENU_ITEM_SEPARATOR, MenuItemSeparator, MenuItemText } from "~/atoms/context-menu"
import {
  getReadabilityStatus,
  ReadabilityStatus,
  setReadabilityStatus,
  useEntryIsInReadability,
} from "~/atoms/readability"
import { useShowSourceContent } from "~/atoms/source-content"
import { useUserRole, whoami } from "~/atoms/user"
import { ipcServices } from "~/lib/client"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { getCommand, useRunCommandFn } from "~/modules/command/hooks/use-command"
import { useCommandShortcuts } from "~/modules/command/hooks/use-command-binding"
import type { FollowCommandId } from "~/modules/command/types"
import { useToolbarOrderMap } from "~/modules/customize-toolbar/hooks"

export const enableEntryReadability = async ({ id, url }: { id: string; url: string }) => {
  const status = getReadabilityStatus()[id]
  const isTurnOn = status !== ReadabilityStatus.INITIAL && !!status
  if (isTurnOn) return
  toggleEntryReadability({ id, url })
}

export const toggleEntryReadability = async ({ id, url }: { id: string; url: string }) => {
  const status = getReadabilityStatus()[id]
  const isTurnOn = status !== ReadabilityStatus.INITIAL && !!status

  if (!isTurnOn && url) {
    setReadabilityStatus({
      [id]: ReadabilityStatus.WAITING,
    })
    try {
      const data = getEntry(id)?.readabilityContent

      if (!data) {
        await entrySyncServices.fetchEntryReadabilityContent(id, async () => {
          const res = await ipcServices?.reader.readability({ url })
          return res?.content
        })
      }

      setReadabilityStatus({
        [id]: ReadabilityStatus.SUCCESS,
      })
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

const entrySelector = (state: EntryModel) => {
  const content = state.content || ""
  const hasContent = !!content
  const doesContentContainsHTMLTags = doesTextContainHTML(content)

  const { summary, translation, readability } = state.settings || {}

  const media = state.media || []
  const images = media.filter((a) => a.type === "photo")
  const imagesLength = images.length

  return {
    feedId: state.feedId,
    inboxId: state.inboxHandle,
    url: state.url,
    publishedAt: state.publishedAt.toISOString(),
    read: state.read,
    summary,
    translation,
    readability,
    hasContent,
    doesContentContainsHTMLTags,
    imagesLength,
  }
}

export const useEntryActions = ({
  entryId,
  view,
  compact,
}: {
  entryId: string
  view: FeedViewType
  compact?: boolean
}) => {
  const entry = useEntry(entryId, entrySelector)
  const isInCollection = useIsEntryStarred(entryId)
  const isEntryInReadability = useEntryIsInReadability(entryId)

  const feed = useFeedById(entry?.feedId, (feed) => {
    return {
      type: feed.type,
      ownerUserId: feed.ownerUserId,
      id: feed.id,
      siteUrl: feed.siteUrl,
    }
  })

  const isInbox = useIsInbox(entry?.inboxId)
  const isShowSourceContent = useShowSourceContent()
  const isShowAISummaryAuto = useShowAISummaryAuto(entry?.summary)
  const isShowAISummaryOnce = useShowAISummaryOnce()
  const isShowAITranslationAuto = useShowAITranslationAuto(!!entry?.translation)
  const isShowAITranslationOnce = useShowAITranslationOnce()

  const runCmdFn = useRunCommandFn()
  const hasEntry = !!entry

  const userRole = useUserRole()

  const shortcuts = useCommandShortcuts()

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
        // shortcut: shortcuts.entry.tip.key,
        shortcut: shortcuts[COMMAND_ID.entry.tip],
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.star,
        onClick: runCmdFn(COMMAND_ID.entry.star, [{ entryId, view }]),
        active: isInCollection,
        shortcut: shortcuts[COMMAND_ID.entry.star],
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.copyTitle,
        onClick: runCmdFn(COMMAND_ID.entry.copyTitle, [{ entryId }]),
        shortcut: shortcuts[COMMAND_ID.entry.copyTitle],
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.copyLink,
        onClick: runCmdFn(COMMAND_ID.entry.copyLink, [{ entryId }]),
        hide: !entry.url,
        shortcut: shortcuts[COMMAND_ID.entry.copyLink],
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.exportAsPDF,
        onClick: runCmdFn(COMMAND_ID.entry.exportAsPDF, [{ entryId }]),
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.imageGallery,
        hide: entry.imagesLength <= 5,
        onClick: runCmdFn(COMMAND_ID.entry.imageGallery, [{ entryId }]),
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.openInBrowser,
        hide: !entry.url,
        onClick: runCmdFn(COMMAND_ID.entry.openInBrowser, [{ entryId }]),
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.viewSourceContent,
        onClick: runCmdFn(COMMAND_ID.entry.viewSourceContent, [
          { entryId, siteUrl: feed?.siteUrl },
        ]),
        hide: isMobile() || !entry.url,
        active: isShowSourceContent,
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.toggleAISummary,
        onClick: runCmdFn(COMMAND_ID.entry.toggleAISummary, []),
        hide:
          isShowAISummaryAuto ||
          ([FeedViewType.SocialMedia, FeedViewType.Videos] as (number | undefined)[]).includes(
            view,
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
            view,
          ),
        active: isShowAITranslationOnce,
        disabled: userRole === UserRole.Trial,
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.share,
        onClick: runCmdFn(COMMAND_ID.entry.share, [{ entryId }]),
        hide: !entry.url,
        shortcut: shortcuts[COMMAND_ID.entry.share],
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.readAbove,
        onClick: runCmdFn(COMMAND_ID.entry.readAbove, [{ publishedAt: entry.publishedAt }]),
        hide: !!isInCollection,
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.read,
        onClick: runCmdFn(COMMAND_ID.entry.read, [{ entryId }]),
        hide: !!isInCollection,
        active: !!entry.read,
        shortcut: shortcuts[COMMAND_ID.entry.read],
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.readBelow,
        onClick: runCmdFn(COMMAND_ID.entry.readBelow, [{ publishedAt: entry.publishedAt }]),
        hide: !!isInCollection,
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
        onClick: runCmdFn(COMMAND_ID.entry.tts, [{ entryId }]),
        hide: !IN_ELECTRON || compact || !entry.hasContent,
        shortcut: shortcuts[COMMAND_ID.entry.tts],
        entryId,
      }),
      new EntryActionMenuItem({
        id: COMMAND_ID.entry.readability,
        onClick: runCmdFn(COMMAND_ID.entry.readability, [{ entryId, entryUrl: entry.url! }]),
        hide: !!entry.readability || compact || (view && views[view]!.wideMode) || !entry.url,
        active: isEntryInReadability,
        notice: !entry.doesContentContainsHTMLTags && !isEntryInReadability,
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
    hasEntry,
    runCmdFn,
    entryId,
    feed?.id,
    feed?.ownerUserId,
    feed?.siteUrl,
    isInbox,
    shortcuts,
    view,
    isInCollection,
    entry?.url,
    entry?.publishedAt,
    entry?.hasContent,
    entry?.read,
    entry?.readability,
    entry?.imagesLength,
    isShowSourceContent,
    isShowAISummaryAuto,
    isShowAISummaryOnce,
    userRole,
    isShowAITranslationAuto,
    isShowAITranslationOnce,
    compact,
    isEntryInReadability,
    entry?.doesContentContainsHTMLTags,
  ])

  return actionConfigs
}

export const useSortedEntryActions = ({
  entryId,
  view,
  compact,
}: {
  entryId: string
  view: FeedViewType
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
