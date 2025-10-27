import { getReadonlyRoute } from "@follow/components/atoms/route.js"
import { useGlobalFocusableHasScope } from "@follow/components/common/Focusable/hooks.js"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import { LinearBlur } from "@follow/components/ui/progressive-blur/index.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import { Routes } from "@follow/constants"
import { ELECTRON_BUILD } from "@follow/shared/constants"
import { springScrollTo } from "@follow/utils/scroller"
import { clsx, cn, getOS } from "@follow/utils/utils"
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

/**
 * SubviewLayout Component
 *
 * A full-screen modal-style layout for subview pages like Discover, AI, etc.
 * This layout provides:
 * - Fullscreen overlay with enhanced header controls
 * - Smooth scroll behavior with progress indicators
 * - Progressive mask blur effects
 * - Back navigation with ESC key support
 * - Dynamic title display based on scroll position
 * - Configurable right-side action buttons
 *
 * Layout Structure:
 * ```
 * SubviewLayout
 * ├── Fixed Header (progressive mask blur)
 * │   ├── Back Button (left)
 * │   ├── Title (center, fade in on scroll)
 * │   └── Action Buttons (right, configurable)
 * ├── Scrollable Content Area
 * │   └── Outlet (renders subview pages)
 * └── Progress FAB (bottom-right, scroll to top)
 * ```
 *
 * @component
 * @example
 * // Used for routes like /discover, /power, /action, /rsshub
 * // Provides full-screen modal-like experience
 */
export function SubviewLayout() {
  return (
    <Focusable className="contents" scope={HotkeyScope.SubLayer}>
      <SubviewLayoutInner />
    </Focusable>
  )
}

/**
 * SubviewLayoutInner Component
 *
 * The inner implementation of SubviewLayout that handles:
 * - Scroll state management and progress tracking
 * - Header elevation and transparency effects
 * - Navigation history and ESC key handling
 * - Dynamic title visibility based on scroll position
 * - Smooth scroll animations and auto-scroll behavior
 *
 * @component
 * @internal
 */
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
  }, [location.pathname, discoverType, scrollRef, navigationType])

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
          "absolute inset-x-0 top-0 z-10 overflow-hidden transition-all duration-300 ease-out",
          isHeaderElevated && isElectronWindows && "-top-5",
        )}
      >
        <m.div className={cn("flex items-center gap-3 p-4", "relative")}>
          <LinearBlur className="absolute inset-0 z-[-1]" tint="var(--fo-background)" side="top" />
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
                className={clsx(
                  "pointer-events-auto inline-flex max-w-[60%] items-center justify-center",
                  "px-8 py-2 text-center duration-200",
                  isTitleVisible ? "opacity-100" : "opacity-0",
                )}
              >
                <div className="truncate font-semibold text-text">{title}</div>
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
          "-mt-2 inline-flex items-center gap-1.5 rounded-full bg-fill p-2 backdrop-blur-background duration-200",
          "has-[:nth-child(1)]:bg-transparent",
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
          ? "border-border/50 bg-material-ultra-thin opacity-100 shadow-sm backdrop-blur-xl"
          : "border-transparent bg-material-medium",
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
          <span className="text-xs font-medium text-text-secondary">{Math.round(progress)}</span>
        </div>
        <button
          onClick={() => {
            springScrollTo(0, scrollRef)
          }}
          type="button"
          className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover/fab:opacity-100"
        >
          <i className="i-mingcute-arrow-to-up-line" />
        </button>
      </div>
    </div>
  )
}
