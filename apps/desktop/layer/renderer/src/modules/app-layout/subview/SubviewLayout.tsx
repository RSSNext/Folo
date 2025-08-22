import { getReadonlyRoute } from "@follow/components/atoms/route.js"
import { useGlobalFocusableHasScope } from "@follow/components/common/Focusable/hooks.js"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import { Routes } from "@follow/constants"
import { ELECTRON_BUILD } from "@follow/shared/constants"
import { springScrollTo } from "@follow/utils/scroller"
import { cn, getOS } from "@follow/utils/utils"
import { m } from "framer-motion"
import { isValidElement, useCallback, useEffect, useRef, useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { useTranslation } from "react-i18next"
import { NavigationType, Outlet, useLocation, useNavigate, useNavigationType } from "react-router"
import { parseQuery } from "ufo"

import { Focusable } from "~/components/common/Focusable"
import { GlassButton } from "~/components/ui/button/GlassButton"
import { HeaderActionButton, HeaderActionGroup } from "~/components/ui/button/HeaderActionButton"
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
  const [maxScroll, setMaxScroll] = useState(0)

  // Enhanced scroll state management
  const isTitleVisible = scrollY > 60
  const isHeaderElevated = scrollY > 20

  const updateMaxScroll = useCallback(() => {
    if (!scrollRef) return

    const { scrollHeight, clientHeight } = scrollRef
    setMaxScroll(Math.max(0, scrollHeight - clientHeight))
  }, [scrollRef])

  useEffect(() => {
    if (!scrollRef) return

    updateMaxScroll()
    const resizeObserver = new ResizeObserver(updateMaxScroll)
    resizeObserver.observe(scrollRef)

    return () => resizeObserver.disconnect()
  }, [scrollRef, updateMaxScroll])

  const discoverType = parseQuery(location.search).type

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
  }, [location.pathname, discoverType, scrollRef])

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
            "mx-4 mt-4 flex items-center gap-3",
            "transition-all duration-300 ease-out",
          )}
        >
          {/* Left: Back button (circular, glass) */}
          <GlassButton
            description={t("words.back", { ns: "common" })}
            onClick={backHandler}
            className={cn(
              "no-drag-region shrink-0",
              isHeaderElevated ? "opacity-100" : "opacity-80",
            )}
            size="md"
          >
            <i className="i-mingcute-left-line" />
          </GlassButton>

          {/* Center: Content area block (rounded, glass) */}
          <div className="pointer-events-none flex min-h-10 flex-1 items-center justify-center">
            {title ? (
              <div
                className={cn(
                  "pointer-events-auto inline-flex max-w-[60%] items-center justify-center",
                  "rounded-full border px-8 py-2 text-center",
                  "bg-material-thin border-border/50 backdrop-blur-background shadow-sm duration-200",

                  isTitleVisible ? "opacity-100" : "opacity-0",
                )}
              >
                <div className="text-text truncate font-semibold">{title}</div>
              </div>
            ) : null}
          </div>

          {/* Right: Button group block (rounded, glass) */}

          <SubViewHeaderRightView isHeaderElevated={isHeaderElevated} />
        </m.div>
      </div>

      {/* Content Area */}
      <ScrollArea.ScrollArea
        mask={false}
        flex
        ref={setRef}
        rootClassName="w-full"
        viewportClassName="pb-12 pt-24 [&>div]:items-center"
        onUpdateMaxScroll={updateMaxScroll}
      >
        <Outlet />
      </ScrollArea.ScrollArea>

      <RootPortal>
        <ScrollProgressFAB scrollY={scrollY} scrollRef={scrollRef} maxScroll={maxScroll} />
      </RootPortal>
    </div>
  )
}

const SubViewHeaderRightView = ({ isHeaderElevated }: { isHeaderElevated: boolean }) => {
  const rightView = useSubViewRightView()

  if (!rightView) return null

  if (isValidElement(rightView) && (rightView as any).type === HeaderActionGroup) {
    const groupChildren = (rightView as any).props?.children
    const childrenArray = Array.isArray(groupChildren) ? groupChildren : [groupChildren]

    const items = childrenArray
      .map((child: any) => {
        if (isValidElement(child) && (child as any).type === HeaderActionButton) {
          const { onClick, disabled, loading, icon, children: label } = (child as any).props
          const key = (child as any).key ?? icon ?? (typeof label === "string" ? label : undefined)

          return (
            <GlassButton
              key={key}
              description={typeof label === "string" ? label : undefined}
              onClick={() => {
                if (!disabled && !loading) onClick?.()
              }}
              className={cn(disabled || loading ? "cursor-not-allowed opacity-50" : "")}
              size="md"
              theme="auto"
            >
              <i className={cn(icon || (loading ? "i-mgc-loading-3-cute-re animate-spin" : ""))} />
            </GlassButton>
          )
        }
        return null
      })
      .filter(Boolean)

    return (
      <div
        className={cn(
          "bg-fill backdrop-blur-background -mt-2 inline-flex items-center gap-1.5 rounded-full p-2 duration-200",
          !isHeaderElevated && items.length > 1 ? "bg-material-ultra-thin" : "bg-material-medium",
        )}
      >
        {items}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-xl border p-1.5",
        "opacity-0 duration-200",
        isHeaderElevated
          ? "bg-material-ultra-thin border-border/50 opacity-100 shadow-sm backdrop-blur-xl"
          : "bg-material-medium border-transparent",
      )}
    >
      <div className="inline-flex items-center">{rightView}</div>
    </div>
  )
}

const ScrollProgressFAB = ({
  scrollY,
  scrollRef,
  maxScroll,
}: {
  scrollY: number
  scrollRef: any
  maxScroll: number
}) => {
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
