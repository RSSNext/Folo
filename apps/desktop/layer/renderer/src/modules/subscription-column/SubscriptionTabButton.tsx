import { useDroppable } from "@dnd-kit/core"
import { ActionButton } from "@follow/components/ui/button/index.js"
import { FeedViewType, getView } from "@follow/constants"
import { useUnreadByView } from "@follow/store/unread/hooks"
import { cn } from "@follow/utils/utils"
import type { FC } from "react"
import { startTransition, useCallback } from "react"
import { useTranslation } from "react-i18next"

import { MenuItemText, useShowContextMenu } from "~/atoms/context-menu"
import { setUISetting, useUISettingKey } from "~/atoms/settings/ui"
import { FocusablePresets } from "~/components/common/Focusable"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { parseView, useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useTimelineList } from "~/hooks/biz/useTimelineList"
import { useContextMenu } from "~/hooks/common/useContextMenu"

import { resetSelectedFeedIds } from "./atom"
import { useShowTimelineTabsSettingsModal } from "./TimelineTabsSettingsModal"

export function SubscriptionTabButton({
  timelineId,
  shortcut,
}: {
  timelineId: string
  shortcut: string
}) {
  const activeTimelineId = useRouteParamsSelector((s) => s.timelineId)

  const isActive = activeTimelineId === timelineId
  const navigate = useNavigateEntry()
  const navigateToTimeline = useCallback(
    (nextTimelineId: string) => {
      navigate({
        timelineId: nextTimelineId,
        feedId: null,
        entryId: null,
      })
      resetSelectedFeedIds()
    },
    [navigate],
  )
  const setActive = useCallback(() => {
    navigateToTimeline(timelineId)
  }, [navigateToTimeline, timelineId])

  const view = parseView(timelineId)

  if (view === FeedViewType.All) {
    return (
      <ViewAllSwitchButton
        timelineId={timelineId}
        isActive={isActive}
        setActive={setActive}
        shortcut={shortcut}
        navigateToTimeline={navigateToTimeline}
      />
    )
  } else if (typeof view === "number") {
    return (
      <ViewSwitchButton
        view={view}
        timelineId={timelineId}
        isActive={isActive}
        setActive={setActive}
        shortcut={shortcut}
        navigateToTimeline={navigateToTimeline}
      />
    )
  }
}

const useSubscriptionTabContextMenu = ({
  timelineId,
  isActive,
  navigateToTimeline,
}: {
  timelineId: string
  isActive: boolean
  navigateToTimeline: (timelineId: string) => void
}) => {
  const { t } = useTranslation()
  const showContextMenu = useShowContextMenu()
  const showTimelineTabsSettingsModal = useShowTimelineTabsSettingsModal()
  const visibleTimelineList = useTimelineList({ withAll: true, visible: true })
  const hiddenTimelineList = useTimelineList({ withAll: true, hidden: true })

  const canHide = visibleTimelineList.filter((id) => id !== timelineId).length > 0

  const handleHide = useCallback(() => {
    if (!canHide) return

    const nextVisible = visibleTimelineList.filter((id) => id !== timelineId)
    const nextHidden = hiddenTimelineList.filter((id) => id !== timelineId).concat(timelineId)
    setUISetting("timelineTabs", {
      visible: nextVisible,
      hidden: nextHidden,
    })

    if (isActive) {
      const currentIndex = visibleTimelineList.indexOf(timelineId)
      const fallbackTimelineId =
        nextVisible[currentIndex] ?? nextVisible[currentIndex - 1] ?? nextVisible[0]

      if (fallbackTimelineId) {
        navigateToTimeline(fallbackTimelineId)
      }
    }
  }, [canHide, hiddenTimelineList, isActive, navigateToTimeline, timelineId, visibleTimelineList])

  const contextMenuProps = useContextMenu({
    onContextMenu: async (event) => {
      event.preventDefault()
      event.stopPropagation()
      await showContextMenu(
        [
          new MenuItemText({
            label: t("sidebar.timeline_tabs.hide_tab"),
            click: handleHide,
            disabled: !canHide,
          }),
          new MenuItemText({
            label: t("sidebar.timeline_tabs.customize"),
            click: showTimelineTabsSettingsModal,
          }),
        ],
        event,
      )
    },
  })

  return contextMenuProps
}

const ViewAllSwitchButton: FC<{
  timelineId: string
  isActive: boolean
  setActive: () => void
  shortcut: string
  navigateToTimeline: (timelineId: string) => void
}> = ({ timelineId, isActive, setActive, shortcut, navigateToTimeline }) => {
  const unreadByView = useUnreadByView(FeedViewType.All)
  const { t } = useTranslation()
  const showSidebarUnreadCount = useUISettingKey("sidebarShowUnreadCount")
  const item = getView(FeedViewType.All)
  const contextMenuProps = useSubscriptionTabContextMenu({
    timelineId,
    isActive,
    navigateToTimeline,
  })

  return (
    <ActionButton
      shortcutScope={FocusablePresets.isNotFloatingLayerScope}
      key={item.name}
      tooltip={t(item.name, { ns: "common" })}
      shortcut={shortcut}
      className={cn(
        isActive && item.className,
        "flex h-11 w-8 shrink-0 grow flex-col items-center gap-1 text-[1.375rem]",
        ELECTRON ? "hover:!bg-theme-item-hover" : "",
      )}
      {...contextMenuProps}
      onClick={(e) => {
        startTransition(() => {
          setActive()
        })
        e.stopPropagation()
      }}
    >
      {item.icon}
      {showSidebarUnreadCount ? (
        <div className="text-[0.625rem] font-medium leading-none">
          {unreadByView > 99 ? <span className="-mr-0.5">99+</span> : unreadByView}
        </div>
      ) : (
        <i
          className={cn(
            "i-mgc-round-cute-fi text-[0.25rem]",
            unreadByView ? (isActive ? "opacity-100" : "opacity-60") : "opacity-0",
          )}
        />
      )}
    </ActionButton>
  )
}

const ViewSwitchButton: FC<{
  view: FeedViewType
  timelineId: string
  isActive: boolean
  setActive: () => void
  shortcut: string
  navigateToTimeline: (timelineId: string) => void
}> = ({ view, timelineId, isActive, setActive, shortcut, navigateToTimeline }) => {
  const unreadByView = useUnreadByView(view)
  const { t } = useTranslation()
  const showSidebarUnreadCount = useUISettingKey("sidebarShowUnreadCount")
  const item = getView(view)

  const { isOver, setNodeRef } = useDroppable({
    id: `view-${item.name}`,
    data: {
      view: item.view,
    },
  })
  const contextMenuProps = useSubscriptionTabContextMenu({
    timelineId,
    isActive,
    navigateToTimeline,
  })

  return (
    <ActionButton
      shortcutScope={FocusablePresets.isNotFloatingLayerScope}
      ref={setNodeRef}
      key={item.name}
      tooltip={t(item.name, { ns: "common" })}
      shortcut={shortcut}
      className={cn(
        isActive && item.className,
        "flex h-11 w-8 shrink-0 grow flex-col items-center gap-1 text-[1.375rem]",
        ELECTRON ? "hover:!bg-theme-item-hover" : "",
        isOver && "border-orange-400 bg-orange-400/60",
      )}
      {...contextMenuProps}
      onClick={(e) => {
        startTransition(() => {
          setActive()
        })
        e.stopPropagation()
      }}
    >
      {item.icon}
      {showSidebarUnreadCount ? (
        <div className="text-[0.625rem] font-medium leading-none">
          {unreadByView > 99 ? <span className="-mr-0.5">99+</span> : unreadByView}
        </div>
      ) : (
        <i
          className={cn(
            "i-mgc-round-cute-fi text-[0.25rem]",
            unreadByView ? (isActive ? "opacity-100" : "opacity-60") : "opacity-0",
          )}
        />
      )}
    </ActionButton>
  )
}
