import { ActionButton } from "@follow/components/ui/button/index.js"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import { Routes } from "@follow/constants"
import { useTypeScriptHappyCallback } from "@follow/hooks"
import { useRegisterGlobalContext } from "@follow/shared/bridge"
import { ELECTRON_BUILD } from "@follow/shared/constants"
import { clamp, cn } from "@follow/utils/utils"
import { useWheel } from "@use-gesture/react"
import { AnimatePresence, m } from "framer-motion"
import { Lethargy } from "lethargy"
import type { FC, PropsWithChildren } from "react"
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { isHotkeyPressed, useHotkeys } from "react-hotkeys-hook"

import { useRootContainerElement } from "~/atoms/dom"
import { useUISettingKey } from "~/atoms/settings/ui"
import { setTimelineColumnShow, useTimelineColumnShow } from "~/atoms/sidebar"
import { HotKeyScopeMap } from "~/constants"
import { shortcuts } from "~/constants/shortcuts"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useReduceMotion } from "~/hooks/biz/useReduceMotion"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useTimelineList } from "~/hooks/biz/useTimelineList"

import { WindowUnderBlur } from "../../components/ui/background"
import { getSelectedFeedIds, resetSelectedFeedIds, setSelectedFeedIds } from "./atom"
import { useShouldFreeUpSpace } from "./hook"
import { TimelineColumnHeader } from "./TimelineColumnHeader"
import TimelineList from "./TimelineList"
import { TimelineSwitchButton } from "./TimelineSwitchButton"

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
            return timelineList.at(-1)!
          } else {
            return timelineList[i - 1]!
          }
        })
      } else {
        setActive((_, i) => timelineList[(i + 1) % timelineList.length]!)
      }
    },
    { scopes: HotKeyScopeMap.Home },
  )

  useRegisterGlobalContext("goToDiscover", () => {
    window.router.navigate(Routes.Discover)
  })

  const shouldFreeUpSpace = useShouldFreeUpSpace()
  const feedColumnShow = useTimelineColumnShow()
  const rootContainerElement = useRootContainerElement()

  return (
    <WindowUnderBlur
      data-hide-in-print
      className={cn(
        "relative flex h-full flex-col pt-2.5",

        !feedColumnShow && ELECTRON_BUILD && "bg-zinc-200 dark:bg-neutral-800",
        className,
      )}
      onClick={useCallback(() => navigateBackHome(), [navigateBackHome])}
    >
      <TimelineColumnHeader />
      {!feedColumnShow && (
        <RootPortal to={rootContainerElement}>
          <ActionButton
            tooltip={"Toggle Feed Column"}
            className="center left-macos-traffic-light macos:flex absolute top-2.5 z-0 hidden -translate-x-2 text-zinc-500"
            onClick={() => setTimelineColumnShow(true)}
          >
            <i className="i-mgc-layout-leftbar-open-cute-re" />
          </ActionButton>
        </RootPortal>
      )}

      <div className="relative mb-4 mt-3">
        <div className="text-theme-vibrancyFg flex h-11 justify-between gap-0 px-3 text-xl">
          {timelineList.map((timelineId) => (
            <TimelineSwitchButton key={timelineId} timelineId={timelineId} />
          ))}
        </div>
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
            <section key={timelineId} className="w-feed-col h-full shrink-0 snap-center">
              <TimelineList key={timelineId} timelineId={timelineId} />
            </section>
          ))}
        </SwipeWrapper>
      </div>

      {children}
    </WindowUnderBlur>
  )
}

const SwipeWrapper: FC<{
  active: string
  children: React.JSX.Element[]
}> = memo(({ children, active }) => {
  const reduceMotion = useReduceMotion()
  const timelineList = useTimelineList()
  const index = timelineList.indexOf(active)

  const feedColumnWidth = useUISettingKey("feedColWidth")
  const containerRef = useRef<HTMLDivElement>(null)

  const prevActiveIndexRef = useRef(-1)
  const [isReady, setIsReady] = useState(false)

  const [direction, setDirection] = useState<"left" | "right">("right")
  const [currentAnimtedActive, setCurrentAnimatedActive] = useState(index)

  useLayoutEffect(() => {
    const prevActiveIndex = prevActiveIndexRef.current
    if (prevActiveIndex !== index) {
      if (prevActiveIndex < index) {
        setDirection("right")
      } else {
        setDirection("left")
      }
    }
    // eslint-disable-next-line @eslint-react/web-api/no-leaked-timeout
    setTimeout(() => {
      setCurrentAnimatedActive(index)
    }, 0)
    if (prevActiveIndexRef.current !== -1) {
      setIsReady(true)
    }
    prevActiveIndexRef.current = index
  }, [index])

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
