import { getReadonlyRoute } from "@follow/components/atoms/route.js"
import { useGlobalFocusableHasScope } from "@follow/components/common/Focusable/hooks.js"
import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import { Routes } from "@follow/constants"
import { ELECTRON_BUILD } from "@follow/shared/constants"
import { springScrollTo } from "@follow/utils/scroller"
import { cn, getOS } from "@follow/utils/utils"
import { m } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { useTranslation } from "react-i18next"
import { NavigationType, Outlet, useLocation, useNavigate, useNavigationType } from "react-router"

import { Focusable } from "~/components/common/Focusable"
import { HotkeyScope } from "~/constants"

import { useSubViewRightView, useSubViewTitleValue } from "./hooks"

export function SubviewLayout() {
  return (
    <Focusable className="contents" scope={HotkeyScope.SubLayer}>
      <SubviewLayoutInner />
    </Focusable>
  )
}

function SubviewLayoutInner() {
  const navigate = useNavigate()
  const prevLocation = useRef(getReadonlyRoute().location).current
  const title = useSubViewTitleValue()
  const [scrollRef, setRef] = useState(null as HTMLDivElement | null)
  const [scrollY, setScrollY] = useState(0)
  const navigationType = useNavigationType()
  const location = useLocation()

  // Enhanced scroll state management
  const isTitleVisible = scrollY > 60
  const isHeaderElevated = scrollY > 20

  useEffect(() => {
    // Scroll to top search bar when re-navigating to Discover page while already on it
    if (
      navigationType === NavigationType.Replace &&
      location.pathname === Routes.Discover &&
      scrollRef
    ) {
      springScrollTo(0, scrollRef)
    }

    // Scroll to top when navigating to Recommendation page from Discover page
    if (
      navigationType === NavigationType.Push &&
      location.pathname.startsWith(Routes.Discover) &&
      scrollRef
    ) {
      springScrollTo(0, scrollRef)
    }
  }, [location, navigationType, scrollRef])

  useEffect(() => {
    const $scroll = scrollRef

    if (!$scroll) return

    springScrollTo(0, $scroll)
    const handler = () => {
      setScrollY($scroll.scrollTop)
    }
    $scroll.addEventListener("scroll", handler, { passive: true })
    return () => {
      $scroll.removeEventListener("scroll", handler)
    }
  }, [scrollRef])

  const { t } = useTranslation()

  // electron window has pt-[calc(var(--fo-window-padding-top)_-10px)]
  const isElectronWindows = ELECTRON_BUILD && getOS() === "Windows"

  const backHandler = () => {
    if (prevLocation.pathname === location.pathname) {
      navigate({ pathname: "" })
    } else {
      navigate(-1)
    }
  }

  useHotkeys("Escape", backHandler, {
    enabled: useGlobalFocusableHasScope(HotkeyScope.SubLayer),
  })

  return (
    <div className="relative flex size-full">
      {/* Enhanced Header with smooth transitions */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 z-10 transition-all duration-300 ease-out",
          isHeaderElevated && isElectronWindows && "-top-5",
        )}
      >
        <m.div
          className={cn(
            "mx-4 mt-4 rounded-xl border border-transparent px-4 py-3",
            "relative flex items-center",
            "transition-all duration-300 ease-out",
            isHeaderElevated && [
              "border-border/50 bg-background/80 shadow-lg backdrop-blur-xl",
              "supports-[backdrop-filter]:bg-background/60",
            ],
          )}
        >
          {/* Enhanced Back Button - positioned on the left */}
          <m.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="shrink-0">
            <MotionButtonBase
              onClick={backHandler}
              className={cn(
                "no-drag-region group relative flex items-center gap-2 rounded-lg px-3 py-2",
                "text-sm font-medium transition-all duration-200",
                "hover:bg-fill/50 hover:text-text",
                "active:bg-fill/70",
              )}
            >
              <i className="i-mingcute-left-line text-base transition-transform duration-200 group-hover:-translate-x-0.5" />
              <span>{t("words.back", { ns: "common" })}</span>
            </MotionButtonBase>
          </m.div>

          {/* Enhanced Title - absolutely centered */}
          <div className="pointer-events-none absolute inset-x-0 flex justify-center">
            {isTitleVisible && title && (
              <div className="text-center">
                <div className="text-text truncate font-semibold">{title}</div>
              </div>
            )}
          </div>

          {/* Action Area - positioned on the right */}
          <div
            className={cn(
              "ml-auto flex shrink-0 items-center gap-2 opacity-0 duration-200",
              isHeaderElevated && "opacity-100",
            )}
          >
            <SubViewHeaderRightView />
          </div>
        </m.div>
      </div>

      {/* Content Area */}
      <ScrollArea.ScrollArea
        mask={false}
        flex
        ref={setRef}
        rootClassName="w-full"
        viewportClassName="pb-12 pt-24 [&>div]:items-center"
      >
        <Outlet />
      </ScrollArea.ScrollArea>

      <RootPortal>
        <ScrollProgressFAB scrollY={scrollY} scrollRef={scrollRef} />
      </RootPortal>
    </div>
  )
}

const SubViewHeaderRightView = () => {
  const rightView = useSubViewRightView()
  return <div className="inline-flex items-center">{rightView}</div>
}

const ScrollProgressFAB = ({ scrollY, scrollRef }: { scrollY: number; scrollRef: any }) => {
  const [maxScroll, setMaxScroll] = useState(0)
  const location = useLocation()

  useEffect(() => {
    if (!scrollRef) return

    const updateMaxScroll = () => {
      const { scrollHeight, clientHeight } = scrollRef
      setMaxScroll(Math.max(0, scrollHeight - clientHeight))
    }

    updateMaxScroll()
    const resizeObserver = new ResizeObserver(updateMaxScroll)
    resizeObserver.observe(scrollRef)

    return () => resizeObserver.disconnect()
  }, [location.pathname, scrollRef])

  const progress = maxScroll > 0 ? Math.min(100, (scrollY / maxScroll) * 100) : 0
  const showProgress = scrollY > 100 && maxScroll > 100

  return (
    <div
      className={cn(
        "group/fab fixed bottom-6 right-6 z-50 duration-200",
        showProgress && "visible opacity-100",
        !showProgress && "invisible opacity-0",
      )}
    >
      <div className="relative">
        <svg className="size-12 -rotate-90" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-border/30"
          />
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeDasharray={`${progress} 100`}
            className="text-accent"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center opacity-100 transition-opacity duration-200 group-hover/fab:opacity-0">
          <span className="text-text-secondary text-xs font-medium">{Math.round(progress)}</span>
        </div>
        <button
          onClick={() => {
            springScrollTo(0, scrollRef)
          }}
          type="button"
          className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover/fab:opacity-100"
        >
          <i className="i-mingcute-arow-to-up-line" />
        </button>
      </div>
    </div>
  )
}
