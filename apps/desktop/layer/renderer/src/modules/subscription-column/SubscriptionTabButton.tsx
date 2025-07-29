import { useDroppable } from "@dnd-kit/core"
import { ActionButton } from "@follow/components/ui/button/index.js"
import type { FeedViewType } from "@follow/constants"
import { views } from "@follow/constants"
import { useUnreadByView } from "@follow/store/unread/hooks"
import { cn } from "@follow/utils/utils"
import type { FC } from "react"
import { startTransition, useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useUISettingKey } from "~/atoms/settings/ui"
import { FocusablePresets } from "~/components/common/Focusable"
import { ROUTE_TIMELINE_OF_VIEW } from "~/constants"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"

import { resetSelectedFeedIds } from "./atom"

export function SubscriptionTabButton({ timelineId }: { timelineId: string }) {
  const activeTimelineId = useRouteParamsSelector((s) => s.timelineId)
  const isActive = activeTimelineId === timelineId
  const navigate = useNavigateEntry()
  const setActive = useCallback(() => {
    navigate({
      timelineId,
      feedId: null,
      entryId: null,
    })
    resetSelectedFeedIds()
  }, [navigate, timelineId])

  if (timelineId.startsWith(ROUTE_TIMELINE_OF_VIEW)) {
    const id = Number.parseInt(timelineId.slice(ROUTE_TIMELINE_OF_VIEW.length), 10) as FeedViewType
    return <ViewSwitchButton view={id} isActive={isActive} setActive={setActive} />
  }
}

const ViewSwitchButton: FC<{
  view: FeedViewType
  isActive: boolean
  setActive: () => void
}> = ({ view, isActive, setActive }) => {
  const unreadByView = useUnreadByView(view)
  const { t } = useTranslation()
  const showSidebarUnreadCount = useUISettingKey("sidebarShowUnreadCount")
  const item = views.find((item) => item.view === view)!

  const { isOver, setNodeRef } = useDroppable({
    id: `view-${item.name}`,
    data: {
      category: "",
      view: item.view,
    },
  })

  return (
    <ActionButton
      shortcutScope={FocusablePresets.isNotFloatingLayerScope}
      ref={setNodeRef}
      key={item.name}
      tooltip={t(item.name, { ns: "common" })}
      shortcut={`${view + 1}`}
      className={cn(
        isActive && item.className,
        "flex h-11 w-9 shrink-0 flex-col items-center gap-1 text-[1.375rem]",
        ELECTRON ? "hover:!bg-theme-item-hover" : "",
        isOver && "border-orange-400 bg-orange-400/60",
      )}
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
