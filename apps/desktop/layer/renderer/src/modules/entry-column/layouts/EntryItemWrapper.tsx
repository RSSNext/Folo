import { useGlobalFocusableScopeSelector } from "@follow/components/common/Focusable/hooks.js"
import { Spring } from "@follow/components/constants/spring.js"
import { useMobile } from "@follow/components/hooks/useMobile.js"
import { FeedViewType, views } from "@follow/constants"
import { useEntry } from "@follow/store/entry/hooks"
import { unreadSyncService } from "@follow/store/unread/store"
import { cn } from "@follow/utils/utils"
import { AnimatePresence, m } from "motion/react"
import type { FC, MouseEvent, MouseEventHandler, PropsWithChildren, TouchEvent } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { NavLink } from "react-router"
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
import {
  HIDE_ACTIONS_IN_ENTRY_CONTEXT_MENU,
  useEntryActions,
  useSortedEntryActions,
} from "~/hooks/biz/useEntryActions"
import { useFeature } from "~/hooks/biz/useFeature"
import { useFeedActions } from "~/hooks/biz/useFeedActions"
import { getNavigateEntryPath, useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { getRouteParams, useRouteParams, useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useContextMenu } from "~/hooks/common/useContextMenu"
import { copyToClipboard } from "~/lib/clipboard"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { EntryHeaderActions } from "~/modules/entry-content/actions/header-actions"
import { MoreActions } from "~/modules/entry-content/actions/more-actions"

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

  const [showAction, setShowAction] = useState(false)
  const handleMouseEnterMarkRead = useDebounceCallback(
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

  const handleMouseEnter = useMemo(() => {
    return () => {
      setShowAction(true)
      handleMouseEnterMarkRead()
    }
  }, [handleMouseEnterMarkRead])
  const handleMouseLeave = useMemo(() => {
    return (e: React.MouseEvent) => {
      handleMouseEnterMarkRead.cancel()
      // If the mouse is over the action bar, don't hide the action bar
      const { relatedTarget, currentTarget } = e
      if (relatedTarget && relatedTarget instanceof Node && currentTarget.contains(relatedTarget)) {
        return
      }
      setShowAction(false)
    }
  }, [handleMouseEnterMarkRead])

  const isDropdownMenuOpen = useGlobalFocusableScopeSelector(
    FocusablePresets.isNotFloatingLayerScope,
  )

  useEffect(() => {
    // Hide the action bar when dropdown menu is open and click outside
    if (isDropdownMenuOpen) {
      setShowAction(false)
    }
  }, [isDropdownMenuOpen])

  const navigate = useNavigateEntry()
  const navigationPath = useMemo(() => {
    if (!entry?.id) return "#"
    return getNavigateEntryPath({
      entryId: entry?.id,
    })
  }, [entry?.id])

  const handleClick = useCallback(
    (e: TouchEvent<HTMLAnchorElement> | MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      e.stopPropagation()

      const shouldNavigate = getRouteParams().entryId !== entry?.id

      if (!shouldNavigate) return
      if (!entry?.feedId) return
      if (!asRead) {
        unreadSyncService.markEntryAsRead(entry.id)
      }

      // TODO
      // setTimeout(
      //   () => EventBus.dispatch(COMMAND_ID.layout.focusToEntryRender, { highlightBoundary: false }),
      //   60,
      // )

      navigate({
        entryId: entry.id,
      })
    },
    [asRead, entry?.id, entry?.feedId, navigate],
  )
  const handleDoubleClick: MouseEventHandler<HTMLAnchorElement> = useCallback(
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
            return !HIDE_ACTIONS_IN_ENTRY_CONTEXT_MENU.includes(item.id as any)
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

  const aiEnabled = useFeature("ai")
  const isWide = views[view as FeedViewType]?.wideMode || aiEnabled

  return (
    <div data-entry-id={entry?.id} style={style}>
      <NavLink
        to={navigationPath}
        className={cn(
          "hover:bg-theme-item-hover cursor-button relative block duration-200",
          isWide ? "rounded-md" : "",
          (isActive || isContextMenuOpen) && "!bg-theme-item-active",
          itemClassName,
        )}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
        {...contextMenuProps}
        {...(!isMobile ? { onTouchStart: handleClick } : {})}
      >
        {children}
        <AnimatePresence>{showAction && isWide && <ActionBar entryId={entryId} />}</AnimatePresence>
      </NavLink>
    </div>
  )
}

const ActionBar = ({ entryId }: { entryId: string }) => {
  const { mainAction: entryActions } = useSortedEntryActions({
    entryId,
    view: FeedViewType.SocialMedia,
  })
  const { view } = useRouteParams()

  if (entryActions.length === 0) return null

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.9, y: "-1/2" }}
      animate={{ opacity: 1, scale: 1, y: "-1/2" }}
      exit={{ opacity: 0, scale: 0.9, y: "-1/2" }}
      transition={Spring.presets.smooth}
      className="absolute right-1 top-0 -translate-y-1/2 rounded-lg border border-gray-200 bg-white/90 p-1 shadow-sm backdrop-blur-sm dark:border-neutral-900 dark:bg-neutral-900"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1">
        <EntryHeaderActions entryId={entryId} view={view} compact />
        <MoreActions entryId={entryId} view={view} compact />
      </div>
    </m.div>
  )
}
