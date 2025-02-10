import { useDroppable } from "@dnd-kit/core"
import { ActionButton } from "@follow/components/ui/button/index.js"
import { DividerVertical } from "@follow/components/ui/divider/Divider.js"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import type { FeedViewType } from "@follow/constants"
import { Routes, views } from "@follow/constants"
import { useTypeScriptHappyCallback } from "@follow/hooks"
import { useRegisterGlobalContext } from "@follow/shared/bridge"
import { getNodeXInScroller, isNodeVisibleInScroller, nextFrame } from "@follow/utils/dom"
import { clamp, clsx, cn } from "@follow/utils/utils"
import { useWheel } from "@use-gesture/react"
import { AnimatePresence, m } from "framer-motion"
import { Lethargy } from "lethargy"
import type { FC, PropsWithChildren } from "react"
import {
  memo,
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { isHotkeyPressed, useHotkeys } from "react-hotkeys-hook"
import { useTranslation } from "react-i18next"

import { useShowContextMenu } from "~/atoms/context-menu"
import { getMainContainerElement, useRootContainerElement } from "~/atoms/dom"
import { useUISettingKey } from "~/atoms/settings/ui"
import { setFeedColumnShow, useFeedColumnShow } from "~/atoms/sidebar"
import {
  HotKeyScopeMap,
  isElectronBuild,
  ROUTE_TIMELINE_OF_INBOX,
  ROUTE_TIMELINE_OF_LIST,
  ROUTE_TIMELINE_OF_VIEW,
} from "~/constants"
import { shortcuts } from "~/constants/shortcuts"
import { useListActions } from "~/hooks/biz/useFeedActions"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useReduceMotion } from "~/hooks/biz/useReduceMotion"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useTimelineList } from "~/hooks/biz/useTimelineList"
import { useContextMenu } from "~/hooks/common"
import { useListById } from "~/store/list"
import { subscriptionActions } from "~/store/subscription"
import { useFeedUnreadStore } from "~/store/unread"
import { useUnreadByView } from "~/store/unread/hooks"

import { WindowUnderBlur } from "../../components/ui/background"
import { FeedIcon } from "../feed/feed-icon"
import { getSelectedFeedIds, resetSelectedFeedIds, setSelectedFeedIds } from "./atom"
import { FeedColumnHeader } from "./header"
import { useShouldFreeUpSpace } from "./hook"
import styles from "./index.module.css"
import { FeedList } from "./list"

const lethargy = new Lethargy()

const useBackHome = (timelineId?: string) => {
  const navigate = useNavigateEntry()

  return useCallback(
    (overvideTimelineId?: string) => {
      navigate({
        feedId: null,
        entryId: null,
        timelineId: overvideTimelineId ?? timelineId,
      })
    },
    [timelineId, navigate],
  )
}

export function FeedColumn({ children, className }: PropsWithChildren<{ className?: string }>) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const timelineList = useTimelineList()

  const routeParams = useRouteParamsSelector((s) => ({
    timelineId: s.timelineId,
    view: s.view,
    listId: s.listId,
  }))
  const { timelineId, listId } = routeParams
  let { view } = routeParams
  const listView = useListById(listId, (list) => list.view)
  view = listView ?? view ?? 0
  const navigateBackHome = useBackHome(timelineId)
  const setActive = useCallback(
    (args: string | ((prev: string | undefined, index: number) => string)) => {
      let nextActive
      if (typeof args === "function") {
        const index = timelineId ? timelineList.all.indexOf(timelineId) : 0
        nextActive = args(timelineId, index)
      } else {
        nextActive = args
      }

      navigateBackHome(nextActive)
      resetSelectedFeedIds()
    },
    [navigateBackHome, timelineId, timelineList],
  )

  useWheel(
    ({ event, last, memo: wait = false, direction: [dx], delta: [dex] }) => {
      if (!last) {
        const s = lethargy.check(event)
        if (s) {
          if (!wait && Math.abs(dex) > 20) {
            setActive((_, i) => timelineList.all[clamp(i + dx, 0, timelineList.all.length - 1)]!)
            return true
          } else {
            return
          }
        } else {
          return false
        }
      } else {
        return false
      }
    },
    {
      target: carouselRef,
    },
  )

  useHotkeys(
    shortcuts.feeds.switchBetweenViews.key,
    (e) => {
      e.preventDefault()
      if (isHotkeyPressed("Left")) {
        setActive((_, i) => {
          if (i === 0) {
            return timelineList.all.at(-1)!
          } else {
            return timelineList.all[i - 1]!
          }
        })
      } else {
        setActive((_, i) => timelineList.all[(i + 1) % timelineList.all.length]!)
      }
    },
    { scopes: HotKeyScopeMap.Home },
  )

  useRegisterGlobalContext("goToDiscover", () => {
    window.router.navigate(Routes.Discover)
  })

  const shouldFreeUpSpace = useShouldFreeUpSpace()
  const feedColumnShow = useFeedColumnShow()
  const rootContainerElement = useRootContainerElement()

  return (
    <WindowUnderBlur
      data-hide-in-print
      className={cn(
        "relative flex h-full flex-col pt-2.5",

        !feedColumnShow && isElectronBuild && "bg-zinc-200 dark:bg-neutral-800",
        className,
      )}
      onClick={useCallback(() => navigateBackHome(), [navigateBackHome])}
    >
      <FeedColumnHeader />
      {!feedColumnShow && (
        <RootPortal to={rootContainerElement}>
          <ActionButton
            tooltip={"Toggle Feed Column"}
            className="center absolute top-2.5 z-0 hidden -translate-x-2 text-zinc-500 left-macos-traffic-light macos:flex"
            onClick={() => setFeedColumnShow(true)}
          >
            <i className="i-mgc-layout-leftbar-open-cute-re" />
          </ActionButton>
        </RootPortal>
      )}

      <TimelineSelector timelineId={timelineId} />
      <div
        className={cn("relative mt-1 flex size-full", !shouldFreeUpSpace && "overflow-hidden")}
        ref={carouselRef}
        onPointerDown={useTypeScriptHappyCallback((e) => {
          if (!(e.target instanceof HTMLElement) || !e.target.closest("[data-feed-id]")) {
            const nextSelectedFeedIds = getSelectedFeedIds()
            if (nextSelectedFeedIds.length === 0) {
              setSelectedFeedIds(nextSelectedFeedIds)
            } else {
              resetSelectedFeedIds()
            }
          }
        }, [])}
      >
        <SwipeWrapper active={view}>
          {views.map((item, index) => (
            <section key={item.name} className="h-full w-feed-col shrink-0 snap-center">
              <FeedList className="flex size-full flex-col text-sm" view={index} />
            </section>
          ))}
        </SwipeWrapper>
      </div>

      {children}
    </WindowUnderBlur>
  )
}

const TimelineSelector = ({ timelineId }: { timelineId: string | undefined }) => {
  const timelineList = useTimelineList()
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const $scroll = scrollRef.current
    if (!$scroll) {
      return
    }
    const handler = () => {
      const targetElement = [...$scroll.children]
        .filter(($el) => $el.tagName === "BUTTON")
        .find(($el, index) => index === timelineList.all.indexOf(timelineId))
      if (!targetElement) {
        return
      }

      const isInCurrentView = isNodeVisibleInScroller(targetElement, $scroll)
      if (!targetElement || isInCurrentView) {
        return
      }
      const targetX = getNodeXInScroller(targetElement, $scroll)

      $scroll.scrollTo({
        left: targetX,
        behavior: "smooth",
      })
    }
    handler()
  }, [timelineId, timelineList])
  return (
    <div className="mt-3 pb-4">
      <div
        ref={scrollRef}
        className={clsx(
          styles["mask-scroller"],
          "flex h-11 justify-between gap-2 overflow-auto px-3 text-xl text-theme-vibrancyFg scrollbar-none",
        )}
      >
        {timelineList.views.map((timelineId) => (
          <TimelineSwitchButton key={timelineId} timelineId={timelineId} />
        ))}
        {timelineList.views.length > 0 && <DividerVertical className="mx-2 my-auto h-8" />}
        {timelineList.lists.map((timelineId) => (
          <TimelineSwitchButton key={timelineId} timelineId={timelineId} />
        ))}
        {timelineList.lists.length > 0 && <DividerVertical className="mx-2 my-auto h-8" />}
        {timelineList.inboxes.map((timelineId) => (
          <TimelineSwitchButton key={timelineId} timelineId={timelineId} />
        ))}
      </div>
    </div>
  )
}
const TimelineSwitchButton = ({ timelineId }: { timelineId: string }) => {
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
  } else if (timelineId.startsWith(ROUTE_TIMELINE_OF_LIST)) {
    const id = timelineId.slice(ROUTE_TIMELINE_OF_LIST.length)
    return <ListSwitchButton listId={id} isActive={isActive} setActive={setActive} />
  } else if (timelineId.startsWith(ROUTE_TIMELINE_OF_INBOX)) {
    return null // TODO
  }
}

const ViewSwitchButton: FC<{
  view: FeedViewType
  isActive: boolean
  setActive: () => void
}> = ({ view, isActive, setActive }) => {
  const unreadByView = useUnreadByView()
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
      ref={setNodeRef}
      key={item.name}
      tooltip={t(item.name as any)}
      shortcut={`${view + 1}`}
      className={cn(
        isActive && item.className,
        "flex h-11 shrink-0 flex-col items-center gap-1 text-[1.375rem]",
        ELECTRON ? "hover:!bg-theme-item-hover" : "",
        isOver && "border-theme-accent-400 bg-theme-accent-400/60",
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
          {unreadByView[view]! > 99 ? <span className="-mr-0.5">99+</span> : unreadByView[view]}
        </div>
      ) : (
        <i
          className={cn(
            "i-mgc-round-cute-fi text-[0.25rem]",
            unreadByView[view] ? (isActive ? "opacity-100" : "opacity-60") : "opacity-0",
          )}
        />
      )}
    </ActionButton>
  )
}

const ListSwitchButton: FC<{
  listId: string
  isActive: boolean
  setActive: () => void
}> = ({ listId, isActive, setActive }) => {
  const list = useListById(listId)
  const listUnread = useFeedUnreadStore((state) => state.data[listId] || 0)

  const handleNavigate = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()

      setActive()
      subscriptionActions.markReadByFeedIds({
        listId,
      })
      // focus to main container in order to let keyboard can navigate entry items by arrow keys
      nextFrame(() => {
        getMainContainerElement()?.focus()
      })
    },
    [listId, setActive],
  )

  const items = useListActions({ listId })
  const showContextMenu = useShowContextMenu()
  const contextMenuProps = useContextMenu({
    onContextMenu: async (e) => {
      await showContextMenu(items, e)
    },
  })

  if (!list) return null

  return (
    <ActionButton
      key={list.id}
      tooltip={list.title}
      className={cn(
        "flex h-11 shrink-0 flex-col items-center gap-1 text-xl grayscale",
        "hover:!bg-theme-item-hover",
        isActive && "!bg-theme-item-active grayscale-0",
      )}
      onClick={handleNavigate}
      {...contextMenuProps}
    >
      <FeedIcon fallback feed={list} size={22} noMargin />
      {!!listUnread && (
        <div className="center h-2.5 text-[0.25rem]">
          <i className={"i-mgc-round-cute-fi"} />
        </div>
      )}
      {!listUnread && (
        <span className="line-clamp-1 break-all px-1 text-[0.625rem] font-medium leading-none">
          {list.title}
        </span>
      )}
    </ActionButton>
  )
}

const SwipeWrapper: FC<{
  active: number
  children: React.JSX.Element[]
}> = memo(({ children, active }) => {
  const reduceMotion = useReduceMotion()

  const feedColumnWidth = useUISettingKey("feedColWidth")
  const containerRef = useRef<HTMLDivElement>(null)

  const prevActiveIndexRef = useRef(-1)
  const [isReady, setIsReady] = useState(false)

  const [direction, setDirection] = useState<"left" | "right">("right")
  const [currentAnimtedActive, setCurrentAnimatedActive] = useState(active)

  useLayoutEffect(() => {
    const prevActiveIndex = prevActiveIndexRef.current
    if (prevActiveIndex !== active) {
      if (prevActiveIndex < active) {
        setDirection("right")
      } else {
        setDirection("left")
      }
    }
    // eslint-disable-next-line @eslint-react/web-api/no-leaked-timeout
    setTimeout(() => {
      setCurrentAnimatedActive(active)
    }, 0)
    if (prevActiveIndexRef.current !== -1) {
      setIsReady(true)
    }
    prevActiveIndexRef.current = active
  }, [active])

  if (reduceMotion) {
    return <div ref={containerRef}>{children[currentAnimtedActive]}</div>
  }

  return (
    <AnimatePresence mode="popLayout">
      <m.div
        className="grow"
        key={currentAnimtedActive}
        initial={
          isReady
            ? {
                x: direction === "right" ? feedColumnWidth : -feedColumnWidth,
              }
            : true
        }
        animate={{ x: 0 }}
        exit={{
          x: direction === "right" ? -feedColumnWidth : feedColumnWidth,
        }}
        transition={{
          x: { type: "spring", stiffness: 700, damping: 40 },
        }}
        ref={containerRef}
      >
        {children[currentAnimtedActive]}
      </m.div>
    </AnimatePresence>
  )
})
