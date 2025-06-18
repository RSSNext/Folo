import { useGlobalFocusableScopeSelector } from "@follow/components/common/Focusable/hooks.js"
import { useMobile } from "@follow/components/hooks/useMobile.js"
import type { FeedViewType } from "@follow/constants"
import { views } from "@follow/constants"
import { useEntry } from "@follow/store/entry/hooks"
import { unreadSyncService } from "@follow/store/unread/store"
import { EventBus } from "@follow/utils/event-bus"
import { cn } from "@follow/utils/utils"
import type { FC, PropsWithChildren } from "react"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { useDebounceCallback } from "usehooks-ts"

import {
  MENU_ITEM_SEPARATOR,
  MenuItemSeparator,
  MenuItemText,
  useShowContextMenu,
} from "~/atoms/context-menu"
import { useGeneralSettingKey } from "~/atoms/settings/general"
import { FocusablePresets } from "~/components/common/Focusable"
import { useEntryIsRead } from "~/hooks/biz/useAsRead"
import { useContextMenuActionShortCutTrigger } from "~/hooks/biz/useContextMenuActionShortCutTrigger"
import { useEntryActions } from "~/hooks/biz/useEntryActions"
import { useFeedActions } from "~/hooks/biz/useFeedActions"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { getRouteParams, useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useContextMenu } from "~/hooks/common/useContextMenu"
import { copyToClipboard } from "~/lib/clipboard"
import { COMMAND_ID } from "~/modules/command/commands/id"

export const EntryItemWrapper: FC<
  {
    entryId: string
    view: FeedViewType
    itemClassName?: string
    style?: React.CSSProperties
  } & PropsWithChildren
> = ({ entryId, view, children, itemClassName, style }) => {
  const entry = useEntry(entryId, (state) => {
    const { feedId, inboxHandle, read } = state
    const { id, url } = state
    return { feedId, id, inboxId: inboxHandle, read, url }
  })
  const actionConfigs = useEntryActions({ entryId, view })

  const feedItems = useFeedActions({
    feedId: entry?.feedId || entry?.inboxId || "",
    view,
    type: "entryList",
  })
  const isMobile = useMobile()

  const { t } = useTranslation("common")

  const isActive = useRouteParamsSelector(({ entryId }) => entryId === entry?.id, [entry?.id])
  const when = useGlobalFocusableScopeSelector(FocusablePresets.isTimeline)
  useContextMenuActionShortCutTrigger(actionConfigs, isActive && when)

  const asRead = useEntryIsRead(entry)
  const hoverMarkUnread = useGeneralSettingKey("hoverMarkUnread")

  const handleMouseEnter = useDebounceCallback(
    () => {
      if (!hoverMarkUnread) return
      if (!document.hasFocus()) return
      if (asRead) return
      if (!entry?.feedId) return

      unreadSyncService.markEntryAsRead(entry.id)
    },
    233,
    {
      leading: false,
    },
  )

  const navigate = useNavigateEntry()
  const handleClick = useCallback(
    (e) => {
      e.stopPropagation()

      const shouldNavigate = getRouteParams().entryId !== entry?.id
      if (!shouldNavigate) return
      if (!entry?.feedId) return
      if (!asRead) {
        unreadSyncService.markEntryAsRead(entry.id)
      }

      setTimeout(
        () => EventBus.dispatch(COMMAND_ID.layout.focusToEntryRender, { highlightBoundary: false }),
        60,
      )

      navigate({
        entryId: entry.id,
      })
    },
    [asRead, entry?.id, entry?.feedId, navigate],
  )
  const handleDoubleClick: React.MouseEventHandler<HTMLDivElement> = useCallback(
    () => entry?.url && window.open(entry.url, "_blank"),
    [entry?.url],
  )
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false)
  const showContextMenu = useShowContextMenu()

  const contextMenuProps = useContextMenu({
    onContextMenu: async (e) => {
      const $target = e.target as HTMLElement
      const selection = window.getSelection()
      if (selection) {
        const targetHasSelection =
          selection?.toString().length > 0 && $target.contains(selection?.anchorNode)
        if (targetHasSelection) {
          e.stopPropagation()
          return
        }
      }

      e.preventDefault()
      setIsContextMenuOpen(true)

      await showContextMenu(
        [
          ...actionConfigs.filter((item) => {
            if (item instanceof MenuItemSeparator) {
              return true
            }
            return ![
              COMMAND_ID.entry.viewSourceContent,
              COMMAND_ID.entry.toggleAISummary,
              COMMAND_ID.entry.toggleAITranslation,
              COMMAND_ID.settings.customizeToolbar,
              COMMAND_ID.entry.readability,
              COMMAND_ID.entry.exportAsPDF,
              // Copy
              COMMAND_ID.entry.copyTitle,
              COMMAND_ID.entry.copyLink,
            ].includes(item.id as any)
          }),
          MENU_ITEM_SEPARATOR,
          ...feedItems.filter((item) => {
            if (item instanceof MenuItemSeparator) {
              return true
            }
            return item && !item.disabled
          }),

          MENU_ITEM_SEPARATOR,
          // Copy
          ...actionConfigs.filter((item) => {
            if (item instanceof MenuItemSeparator) {
              return false
            }
            return [COMMAND_ID.entry.copyTitle, COMMAND_ID.entry.copyLink].includes(item.id as any)
          }),
          new MenuItemText({
            label: `${t("words.copy")}${t("space")}${t("words.entry")} ${t("words.id")}`,
            click: () => {
              copyToClipboard(entry?.id || "")
            },
          }),
        ],
        e,
      )
      setIsContextMenuOpen(false)
    },
  })

  return (
    <div data-entry-id={entry?.id} style={style}>
      <div
        className={cn(
          "hover:bg-theme-item-hover relative duration-200",
          views[view as FeedViewType]?.wideMode ? "rounded-md" : "px-2",
          (isActive || isContextMenuOpen) && "!bg-theme-item-active",
          itemClassName,
        )}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseEnter.cancel}
        onDoubleClick={handleDoubleClick}
        {...contextMenuProps}
        {...(!isMobile ? { onTouchStart: handleClick } : {})}
      >
        {children}
      </div>
    </div>
  )
}
