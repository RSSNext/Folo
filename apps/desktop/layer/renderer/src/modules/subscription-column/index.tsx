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
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"

import { useRootContainerElement } from "~/atoms/dom"
import { useUISettingKey } from "~/atoms/settings/ui"
import { setTimelineColumnShow, useSubscriptionColumnShow } from "~/atoms/sidebar"
import { Focusable } from "~/components/common/Focusable"
import { HotkeyScope } from "~/constants"
import { useBackHome } from "~/hooks/biz/useNavigateEntry"
import { useReduceMotion } from "~/hooks/biz/useReduceMotion"
import { parseView, useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
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
  const timelineList = useTimelineList({
    withAll: true,
    visible: true,
  })

  const routeParams = useRouteParamsSelector((s) => ({
    timelineId: s.timelineId,
    view: s.view,
    listId: s.listId,
  }))

  const [timelineId, setMemoizedTimelineId] = useState(routeParams.timelineId ?? timelineList[0])

  useEffect(() => {
    if (routeParams.timelineId) setMemoizedTimelineId(routeParams.timelineId)
  }, [routeParams.timelineId])

  const navigateBackHome = useBackHome(timelineId)
  const setActive = useCallback(
    (args: string | ((prev: string | undefined, index: number) => string)) => {
      let nextActive
      if (typeof args === "function") {
        const index = timelineId ? timelineList.indexOf(timelineId) : 0
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
            setActive((_, i) => timelineList[clamp(i + dx, 0, timelineList.length - 1)]!)
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
      <CommandsHandler setActive={setActive} timelineList={timelineList} />
      <SubscriptionColumnHeader />
      {!feedColumnShow && (
        <RootPortal to={rootContainerElement}>
          <ActionButton
            tooltip={"Toggle Feed Column"}
            className="center absolute left-0 top-2.5 z-0 hidden -translate-x-2 text-zinc-500 macos:flex macos:left-macos-traffic-light-2"
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
          {timelineList.map((timelineId) => (
            <section key={timelineId} className="h-full w-feed-col shrink-0 snap-center">
              <SubscriptionListGuard
                key={timelineId}
                view={parseView(timelineId) ?? FeedViewType.Articles}
                isSubscriptionLoading={isSubscriptionLoading}
              />
            </section>
          ))}
        </SwipeWrapper>
      </div>

      {children}
    </WindowUnderBlur>
  )
}

const SwipeWrapper: FC<{ active: string; children: React.JSX.Element[] }> = memo(
  ({ children, active }) => {
    const reduceMotion = useReduceMotion()
    const timelineList = useTimelineList({ withAll: true, visible: true })
    const viewIndex = timelineList.indexOf(active)

    const feedColumnWidth = useUISettingKey("feedColWidth")
    const containerRef = useRef<HTMLDivElement>(null)

    const orderIndex = timelineList.indexOf(active)

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
  const timelineList = useTimelineList({ withAll: true, visible: true })

  return (
    <div className="flex h-11 items-center px-1 text-xl text-text-secondary">
      {timelineList.map((timelineId, index) => (
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
