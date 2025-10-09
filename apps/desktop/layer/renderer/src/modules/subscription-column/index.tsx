import { useGlobalFocusableScopeSelector } from "@follow/components/common/Focusable/hooks.js"
import { Spring } from "@follow/components/constants/spring.js"
import { ActionButton } from "@follow/components/ui/button/index.js"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import { FeedViewType } from "@follow/constants"
import { useTypeScriptHappyCallback } from "@follow/hooks"
import { ELECTRON_BUILD } from "@follow/shared/constants"
import { usePrefetchSubscription } from "@follow/store/subscription/hooks"
import { usePrefetchUnread } from "@follow/store/unread/hooks"
import { EventBus } from "@follow/utils/event-bus"
import { clamp, cn } from "@follow/utils/utils"
import { useWheel } from "@use-gesture/react"
import { Lethargy } from "lethargy"
import { AnimatePresence, m } from "motion/react"
import type { FC, PropsWithChildren } from "react"
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

import { useRootContainerElement } from "~/atoms/dom"
import { useUISettingKey } from "~/atoms/settings/ui"
import {
  setTimelineColumnShow,
  useSubscriptionColumnApronNode,
  useSubscriptionColumnShow,
} from "~/atoms/sidebar"
import { Focusable } from "~/components/common/Focusable"
import { HotkeyScope, ROUTE_TIMELINE_OF_VIEW, ROUTE_VIEW_ALL } from "~/constants"
import { useFeature } from "~/hooks/biz/useFeature"
import { useBackHome } from "~/hooks/biz/useNavigateEntry"
import { useReduceMotion } from "~/hooks/biz/useReduceMotion"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useTimelineList } from "~/hooks/biz/useTimelineList"

import { WindowUnderBlur } from "../../components/ui/background"
import { COMMAND_ID } from "../command/commands/id"
import { useCommandBinding } from "../command/hooks/use-command-binding"
import { getSelectedFeedIds, resetSelectedFeedIds, setSelectedFeedIds } from "./atom"
import { useShouldFreeUpSpace } from "./hook"
import { SubscriptionListGuard } from "./subscription-list/SubscriptionListGuard"
import { SubscriptionColumnHeader } from "./SubscriptionColumnHeader"
import { SubscriptionTabButton } from "./SubscriptionTabButton"

const lethargy = new Lethargy()

export function SubscriptionColumn({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  const { isLoading: isSubscriptionLoading } = usePrefetchSubscription()
  usePrefetchUnread()

  const carouselRef = useRef<HTMLDivElement>(null)
  const timelineList = useTimelineList()
  const aiEnabled = useFeature("ai")
  const allTimelineList = useMemo(() => {
    if (aiEnabled) return [ROUTE_VIEW_ALL, ...timelineList]
    return timelineList
  }, [aiEnabled, timelineList])

  const routeParams = useRouteParamsSelector((s) => ({
    timelineId: s.timelineId,
    view: s.view,
    listId: s.listId,
  }))

  const [timelineId, setMemoizedTimelineId] = useState(routeParams.timelineId ?? allTimelineList[0])

  useEffect(() => {
    if (routeParams.timelineId) setMemoizedTimelineId(routeParams.timelineId)
  }, [routeParams.timelineId])

  const navigateBackHome = useBackHome(timelineId)
  const setActive = useCallback(
    (args: string | ((prev: string | undefined, index: number) => string)) => {
      let nextActive
      if (typeof args === "function") {
        const index = timelineId ? allTimelineList.indexOf(timelineId) : 0
        nextActive = args(timelineId, index)
      } else {
        nextActive = args
      }

      navigateBackHome(nextActive)
      resetSelectedFeedIds()
    },
    [navigateBackHome, timelineId, allTimelineList],
  )

  useWheel(
    ({ event, last, memo: wait = false, direction: [dx], delta: [dex] }) => {
      if (!last) {
        const s = lethargy.check(event)
        if (s) {
          if (!wait && Math.abs(dex) > 20) {
            setActive((_, i) => allTimelineList[clamp(i + dx, 0, allTimelineList.length - 1)]!)
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
    { target: carouselRef },
  )

  const shouldFreeUpSpace = useShouldFreeUpSpace()
  const feedColumnShow = useSubscriptionColumnShow()
  const rootContainerElement = useRootContainerElement()

  const focusableContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!focusableContainerRef.current) return
    focusableContainerRef.current.focus()
  }, [])

  return (
    <WindowUnderBlur
      as={Focusable}
      scope={HotkeyScope.SubscriptionList}
      data-hide-in-print
      className={cn(
        !feedColumnShow && ELECTRON_BUILD && "bg-material-opaque",
        "relative flex h-full flex-col pt-2.5",
        className,
      )}
      ref={focusableContainerRef}
      onClick={useCallback(async () => {
        if (document.hasFocus()) {
          navigateBackHome()
        }
      }, [navigateBackHome])}
    >
      <CommandsHandler setActive={setActive} timelineList={allTimelineList} />
      <SubscriptionColumnHeader />
      {!feedColumnShow && (
        <RootPortal to={rootContainerElement}>
          <ActionButton
            tooltip={"Toggle Feed Column"}
            className="center macos:left-macos-traffic-light-2 macos:flex absolute left-0 top-2.5 z-0 hidden -translate-x-2 text-zinc-500"
            onClick={() => setTimelineColumnShow(true)}
          >
            <i className="i-mgc-layout-leftbar-open-cute-re" />
          </ActionButton>
        </RootPortal>
      )}

      <div className="relative mb-2 mt-3">
        <TabsRow />
      </div>
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
        <SwipeWrapper active={timelineId!}>
          {allTimelineList.map((timelineId) => (
            <section key={timelineId} className="w-feed-col h-full shrink-0 snap-center">
              <SubscriptionListGuard
                key={timelineId}
                view={
                  timelineId === ROUTE_VIEW_ALL
                    ? FeedViewType.All
                    : (Number.parseInt(
                        timelineId.slice(ROUTE_TIMELINE_OF_VIEW.length),
                        10,
                      ) as FeedViewType)
                }
                isSubscriptionLoading={isSubscriptionLoading}
              />
            </section>
          ))}
        </SwipeWrapper>
      </div>

      <ApronNodeContainer />

      {children}
    </WindowUnderBlur>
  )
}

const ApronNodeContainer: FC = () => {
  return useSubscriptionColumnApronNode()
}

const SwipeWrapper: FC<{ active: string; children: React.JSX.Element[] }> = memo(
  ({ children, active }) => {
    const reduceMotion = useReduceMotion()
    const timelineList = useTimelineList()
    const aiEnabled = useFeature("ai")
    const allTimelineList = useMemo(() => {
      if (aiEnabled) return [ROUTE_VIEW_ALL, ...timelineList]
      return timelineList
    }, [aiEnabled, timelineList])
    const viewIndex = allTimelineList.indexOf(active)

    const feedColumnWidth = useUISettingKey("feedColWidth")
    const timelineTabs = useUISettingKey("timelineTabs")
    const containerRef = useRef<HTMLDivElement>(null)

    // Use custom ordering for direction calculation
    const orderedForDirection = useMemo(() => {
      if (allTimelineList.length === 0) return [] as string[]
      const first = allTimelineList[0]
      const rest = allTimelineList.slice(1)
      const savedVisible = (timelineTabs?.visible ?? []).filter((id) => rest.includes(id))
      const ordered = [first, ...savedVisible, ...rest.filter((id) => !savedVisible.includes(id))]
      return ordered
    }, [allTimelineList, timelineTabs])

    const orderIndex = orderedForDirection.indexOf(active)

    const prevOrderIndexRef = useRef(-1)
    const [isReady, setIsReady] = useState(false)

    const [direction, setDirection] = useState<"left" | "right">("right")
    const [currentAnimtedActive, setCurrentAnimatedActive] = useState(viewIndex)

    useLayoutEffect(() => {
      const prevOrderIndex = prevOrderIndexRef.current
      if (prevOrderIndex !== orderIndex) {
        if (prevOrderIndex < orderIndex) setDirection("right")
        else setDirection("left")
      }
      // eslint-disable-next-line @eslint-react/web-api/no-leaked-timeout
      setTimeout(() => {
        setCurrentAnimatedActive(viewIndex)
      }, 0)
      if (prevOrderIndexRef.current !== -1) {
        setIsReady(true)
      }
      prevOrderIndexRef.current = orderIndex
    }, [orderIndex, viewIndex])

    if (reduceMotion) {
      return <div ref={containerRef}>{children[currentAnimtedActive]}</div>
    }

    return (
      <AnimatePresence mode="popLayout">
        <m.div
          className="grow"
          key={currentAnimtedActive}
          initial={
            isReady ? { x: direction === "right" ? feedColumnWidth : -feedColumnWidth } : true
          }
          animate={{ x: 0 }}
          exit={{ x: direction === "right" ? -feedColumnWidth : feedColumnWidth }}
          transition={Spring.presets.snappy}
          ref={containerRef}
        >
          {children[currentAnimtedActive]}
        </m.div>
      </AnimatePresence>
    )
  },
)

const TabsRow: FC = () => {
  const aiEnabled = useFeature("ai")
  const timelineList = useTimelineList()
  const timelineTabs = useUISettingKey("timelineTabs")

  if (!aiEnabled) {
    return (
      <div className="text-text-secondary flex h-11 items-center gap-0 px-3 text-xl">
        {timelineList.map((timelineId, index) => (
          <SubscriptionTabButton
            key={timelineId}
            timelineId={timelineId}
            shortcut={`${index + 1}`}
          />
        ))}
      </div>
    )
  }

  const savedVisible = (timelineTabs?.visible ?? []).filter((id) => timelineList.includes(id))
  const visible: string[] = [...savedVisible]
  for (const id of timelineList) {
    if (visible.length >= 5) break
    if (!visible.includes(id)) visible.push(id)
  }

  return (
    <div className="text-text-secondary flex h-11 items-center px-1 text-xl">
      <SubscriptionTabButton
        shortcut="BackQuote"
        key={ROUTE_VIEW_ALL}
        timelineId={ROUTE_VIEW_ALL}
      />
      {visible.map((timelineId, index) => (
        <SubscriptionTabButton key={timelineId} timelineId={timelineId} shortcut={`${index + 1}`} />
      ))}
    </div>
  )
}

const CommandsHandler = ({
  setActive,
  timelineList,
}: {
  setActive: (args: string | ((prev: string | undefined, index: number) => string)) => void
  timelineList: string[]
}) => {
  const when = useGlobalFocusableScopeSelector(
    // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-callback
    useCallback(
      (activeScope) =>
        activeScope.or(HotkeyScope.SubscriptionList, HotkeyScope.Timeline) ||
        activeScope.size === 0,
      [],
    ),
  )

  useCommandBinding({
    commandId: COMMAND_ID.subscription.switchTabToNext,
    when,
  })

  useCommandBinding({
    commandId: COMMAND_ID.subscription.switchTabToPrevious,
    when,
  })

  useEffect(() => {
    return EventBus.subscribe(COMMAND_ID.subscription.switchTabToNext, () => {
      setActive((_, i) => timelineList[(i + 1) % timelineList.length]!)
    })
  }, [setActive, timelineList])

  useEffect(() => {
    return EventBus.subscribe(COMMAND_ID.subscription.switchTabToPrevious, () => {
      setActive((_, i) => timelineList[(i - 1 + timelineList.length) % timelineList.length]!)
    })
  }, [setActive, timelineList])

  return null
}
