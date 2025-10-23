import type { FeedViewType } from "@follow/constants"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  MENU_ITEM_SEPARATOR,
  MenuItemSeparator,
  MenuItemText,
  useShowContextMenu,
} from "~/atoms/context-menu"
import { HIDE_ACTIONS_IN_ENTRY_CONTEXT_MENU, useEntryActions } from "~/hooks/biz/useEntryActions"
import { useFeedActions } from "~/hooks/biz/useFeedActions"
import { useContextMenu } from "~/hooks/common/useContextMenu"
import { copyToClipboard } from "~/lib/clipboard"
import { COMMAND_ID } from "~/modules/command/commands/id"

export function useEntryContextMenu({
  entryId,
  view,
  feedId,
}: {
  entryId: string
  view: FeedViewType
  feedId: string
}) {
  const { t } = useTranslation("common")
  const showContextMenu = useShowContextMenu()

  const actionConfigs = useEntryActions({ entryId, view })
  const feedItems = useFeedActions({ feedId, view, type: "entryList" })

  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false)

  const buildMenuItems = useCallback(() => {
    return [
      ...actionConfigs.filter((item) => {
        if (item instanceof MenuItemSeparator) return true

        return !HIDE_ACTIONS_IN_ENTRY_CONTEXT_MENU.includes(item.id)
      }),
      MENU_ITEM_SEPARATOR,
      ...feedItems.filter((item) => {
        if (item instanceof MenuItemSeparator) return true

        return item && !item.disabled
      }),
      MENU_ITEM_SEPARATOR,
      // Copy section
      ...actionConfigs.filter((item) => {
        if (item instanceof MenuItemSeparator) return false
        // @ts-expect-error id exists
        return [COMMAND_ID.entry.copyTitle, COMMAND_ID.entry.copyLink].includes(item.id)
      }),
      new MenuItemText({
        label: `${t("words.copy")}${t("space")}${t("words.entry")} ${t("words.id")}`,
        click: () => copyToClipboard(entryId),
      }),
    ]
  }, [actionConfigs, feedItems, t, entryId])

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
      await showContextMenu(buildMenuItems(), e)
      setIsContextMenuOpen(false)
    },
  })

  const openContextMenuAt = useCallback(
    async (x: number, y: number) => {
      const mouseEvent = new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
      })
      // Delegate to the same onContextMenu handler
      // @ts-expect-error MouseEvent type alignment
      await contextMenuProps.onContextMenu?.(mouseEvent)
    },
    [contextMenuProps],
  )

  return useMemo(
    () => ({ contextMenuProps, isContextMenuOpen, openContextMenuAt }),
    [contextMenuProps, isContextMenuOpen, openContextMenuAt],
  )
}
