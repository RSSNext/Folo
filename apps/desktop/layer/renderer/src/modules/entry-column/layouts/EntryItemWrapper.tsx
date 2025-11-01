import { useGlobalFocusableScopeSelector } from "@follow/components/common/Focusable/hooks.js"
import { useMobile } from "@follow/components/hooks/useMobile.js"
import { getMousePosition } from "@follow/components/hooks/useMouse.js"
import { ActionButton } from "@follow/components/ui/button/action-button.js"
import { FeedViewType } from "@follow/constants"
import { useEntry } from "@follow/store/entry/hooks"
import { unreadSyncService } from "@follow/store/unread/store"
import { cn } from "@follow/utils/utils"
import { AnimatePresence } from "motion/react"
import type { FC, MouseEvent, PropsWithChildren, TouchEvent } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { NavLink } from "react-router"
import { useDebounceCallback } from "usehooks-ts"

import { useGeneralSettingKey } from "~/atoms/settings/general"
import { FocusablePresets } from "~/components/common/Focusable"
import { CommandActionButton } from "~/components/ui/button/CommandActionButton"
import { useEntryIsRead } from "~/hooks/biz/useAsRead"
import { useContextMenuActionShortCutTrigger } from "~/hooks/biz/useContextMenuActionShortCutTrigger"
import {
  EntryActionMenuItem,
  HIDE_ACTIONS_IN_ENTRY_TOOLBAR_ACTIONS,
  useEntryActions,
  useSortedEntryActions,
} from "~/hooks/biz/useEntryActions"
import { useEntryContextMenu } from "~/hooks/biz/useEntryContextMenu"
import { getNavigateEntryPath, useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { getRouteParams, useRouteParams, useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useShowEntryDetailsColumn } from "~/hooks/biz/useShowEntryDetailsColumn"

export const EntryItemWrapper: FC<
  {
    entryId: string
    view: FeedViewType
    isFirstItem?: boolean
    itemClassName?: string
    style?: React.CSSProperties
  } & PropsWithChildren
> = ({ entryId, view, children, itemClassName, style, isFirstItem }) => {
  const entry = useEntry(entryId, (state) => {
    const { feedId, inboxHandle } = state
    const { id, url } = state
    return { feedId, id, inboxId: inboxHandle, url }
  })
  const actionConfigs = useEntryActions({ entryId, view })
  const isMobile = useMobile()

  const isActive = useRouteParamsSelector(({ entryId }) => entryId === entry?.id, [entry?.id])
  const when = useGlobalFocusableScopeSelector(FocusablePresets.isTimeline)
  useContextMenuActionShortCutTrigger(actionConfigs, isActive && when)
  const showEntryDetailsColumn = useShowEntryDetailsColumn()

  const asRead = useEntryIsRead(entryId)
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

  const handleDoubleClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (!entry?.url) return
      if (!entry?.id) return
      window.open(entry?.url, "_blank", "noopener,noreferrer")
    },
    [entry?.id, entry?.url],
  )

  const handleClick = useCallback(
    (e: TouchEvent<HTMLElement> | MouseEvent<HTMLElement>) => {
      e.preventDefault()
      e.stopPropagation()

      const shouldNavigate = getRouteParams().entryId !== entry?.id

      if (!shouldNavigate) return
      if (!entry?.feedId) return
      if (!asRead) {
        unreadSyncService.markEntryAsRead(entry.id)
      }

      navigate({
        view,
        entryId: entry.id,
      })
    },
    [asRead, entry?.id, entry?.feedId, navigate, view],
  )
  const { contextMenuProps, isContextMenuOpen, openContextMenuAt } = useEntryContextMenu({
    entryId,
    view,
    feedId: entry?.feedId || entry?.inboxId || "",
  })

  const isWide = !showEntryDetailsColumn

  const Link = view === FeedViewType.SocialMedia ? "article" : NavLink
  const isAll = view === FeedViewType.All
  return (
    <div data-entry-id={entry?.id} style={style}>
      <Link
        to={navigationPath}
        className={cn(
          "relative block cursor-button overflow-visible duration-200 hover:bg-theme-item-hover",
          isWide ? "rounded-none @[650px]:rounded-md" : "",
          isAll && "!rounded-none",
          (isActive || isContextMenuOpen) && "!bg-theme-item-active",
          itemClassName,
        )}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...contextMenuProps}
        {...(!isMobile ? { onTouchStart: handleClick } : {})}
      >
        {children}
        <AnimatePresence>
          {showAction && isWide && (
            <ActionBar
              openContextMenu={() => {
                const { x, y } = getMousePosition()
                void openContextMenuAt(x, y)
              }}
              entryId={entryId}
              isFirstItem={!!isFirstItem}
            />
          )}
        </AnimatePresence>
      </Link>
    </div>
  )
}

const ActionBar = ({
  entryId,
  openContextMenu,
  isFirstItem,
}: {
  entryId: string
  openContextMenu: () => void
  isFirstItem: boolean
}) => {
  const { view } = useRouteParams()

  const { mainAction } = useSortedEntryActions({ entryId, view })

  return (
    <div
      className={cn(
        "absolute -right-2 top-0 -translate-y-1/2 rounded-lg border border-gray-200 bg-white/90 p-1 shadow-sm backdrop-blur-sm dark:border-neutral-900 dark:bg-neutral-900",
        isFirstItem && "-right-2 top-4",
        view === FeedViewType.All && "right-1 top-1/2",
      )}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
      }}
    >
      <div className="flex items-center gap-1">
        {(
          mainAction.filter(
            (item) =>
              item instanceof EntryActionMenuItem &&
              !HIDE_ACTIONS_IN_ENTRY_TOOLBAR_ACTIONS.includes(item.id),
          ) as EntryActionMenuItem[]
        ).map((item) => (
          <CommandActionButton key={item.id} onClick={item.onClick} size="xs" commandId={item.id} />
        ))}

        <ActionButton
          onClick={openContextMenu}
          size="xs"
          icon={<i className="i-mingcute-more-1-fill" />}
        />
      </div>
    </div>
  )
}
