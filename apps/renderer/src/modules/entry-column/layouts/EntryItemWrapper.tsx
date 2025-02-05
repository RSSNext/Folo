import type { FeedViewType } from "@follow/constants"
import { views } from "@follow/constants"
import { cn } from "@follow/utils/utils"
import type { FC, PropsWithChildren } from "react"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { useDebounceCallback } from "usehooks-ts"

import { useShowContextMenu } from "~/atoms/context-menu"
import { useGeneralSettingKey } from "~/atoms/settings/general"
import { useAsRead } from "~/hooks/biz/useAsRead"
import { useEntryActions } from "~/hooks/biz/useEntryActions"
import { useFeedActions } from "~/hooks/biz/useFeedActions"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useContextMenu } from "~/hooks/common/useContextMenu"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { getCommand } from "~/modules/command/hooks/use-command"
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

  const { t } = useTranslation("common")

  const isActive = useRouteParamsSelector(
    ({ entryId }) => entryId === entry.entries.id,
    [entry.entries.id],
  )

  const asRead = useAsRead(entry)
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
  const handleClick: React.MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      e.stopPropagation()

      if (!asRead) {
        entryActions.markRead({ feedId: entry.feedId, entryId: entry.entries.id, read: true })
      }
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
          ...actionConfigs
            .filter(
              (item) =>
                !(
                  [
                    COMMAND_ID.entry.viewSourceContent,
                    COMMAND_ID.entry.toggleAISummary,
                    COMMAND_ID.entry.toggleAITranslation,
                    COMMAND_ID.settings.customizeToolbar,
                  ] as string[]
                ).includes(item.id),
            )
            .map((item) => {
              const cmd = getCommand(item.id)

              if (!cmd) return null

              return {
                type: "text" as const,
                label: cmd?.label.title || "",
                click: () => item.onClick(),
                shortcut: item.shortcut,
              }
            }),
          {
            type: "separator" as const,
          },
          ...feedItems.filter((item) => item && !item.disabled),

          {
            type: "separator" as const,
          },
          {
            type: "text" as const,
            label: `${t("words.copy")}${t("space")}${t("words.entry")} ${t("words.id")}`,
            click: () => {
              navigator.clipboard.writeText(entry.entries.id)
            },
          },
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
          "relative",
          asRead ? "text-zinc-700 dark:text-neutral-400" : "text-zinc-900 dark:text-neutral-300",
          views[view as FeedViewType]?.wideMode ? "rounded-md" : "px-2",
          "duration-200 hover:bg-theme-item-hover",
          (isActive || isContextMenuOpen) && "!bg-theme-item-active",
          itemClassName,
        )}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseEnter.cancel}
        onDoubleClick={handleDoubleClick}
        {...contextMenuProps}
      >
        {children}
      </div>
    </div>
  )
}
