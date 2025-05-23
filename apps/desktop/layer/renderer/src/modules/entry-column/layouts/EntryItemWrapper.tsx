import { useMobile } from "@follow/components/hooks/useMobile.js"
import type { FeedViewType } from "@follow/constants"
import { views } from "@follow/constants"
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
import { useEntryIsRead } from "~/hooks/biz/useAsRead"
import { useEntryActions } from "~/hooks/biz/useEntryActions"
import { useFeedActions } from "~/hooks/biz/useFeedActions"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { getRouteParams, useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useContextMenu } from "~/hooks/common/useContextMenu"
import { COMMAND_ID } from "~/modules/command/commands/id"
import type { FlatEntryModel } from "~/store/entry"
import { entryActions } from "~/store/entry"

export const EntryItemWrapper: FC<
  {
    entry: FlatEntryModel
    view?: number
    itemClassName?: string
    style?: React.CSSProperties
  } & PropsWithChildren
> = ({ entry, view, children, itemClassName, style }) => {
  const actionConfigs = useEntryActions({ entryId: entry.entries.id })
  const feedItems = useFeedActions({
    feedId: entry.feedId || entry.inboxId,
    view,
    type: "entryList",
  })
  const isMobile = useMobile()

  const { t } = useTranslation("common")

  const isActive = useRouteParamsSelector(
    ({ entryId }) => entryId === entry.entries.id,
    [entry.entries.id],
  )

  const asRead = useEntryIsRead(entry)
  const hoverMarkUnread = useGeneralSettingKey("hoverMarkUnread")

  const handleMouseEnter = useDebounceCallback(
    () => {
      if (!hoverMarkUnread) return
      if (!document.hasFocus()) return
      if (asRead) return

      entryActions.markRead({ feedId: entry.feedId, entryId: entry.entries.id, read: true })
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

      const shouldNavigate = getRouteParams().entryId !== entry.entries.id
      if (!shouldNavigate) return
      if (!asRead) {
        entryActions.markRead({ feedId: entry.feedId, entryId: entry.entries.id, read: true })
      }

      setTimeout(
        () => EventBus.dispatch(COMMAND_ID.layout.focusToEntryRender, { highlightBoundary: false }),
        60,
      )

      navigate({
        entryId: entry.entries.id,
      })
    },
    [asRead, entry.entries.id, entry.feedId, navigate],
  )
  const handleDoubleClick: React.MouseEventHandler<HTMLDivElement> = useCallback(
    () => entry.entries.url && window.open(entry.entries.url, "_blank"),
    [entry.entries.url],
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
              navigator.clipboard.writeText(entry.entries.id)
            },
          }),
        ],
        e,
      )
      setIsContextMenuOpen(false)
    },
  })

  return (
    <div data-entry-id={entry.entries.id} style={style}>
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
