import { clsx } from "@follow/utils/utils"
import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"

import { ENTRY_COLUMN_LIST_SCROLLER_ID } from "~/constants/dom"

interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => Promise<any>
  className?: string
  scrollContainerSelector?: string
}
const THRESHOLD = 80
const MAX_PULL_DISTANCE = 120

export function PullToRefresh({
  children,
  onRefresh,
  className,
  scrollContainerSelector = `#${ENTRY_COLUMN_LIST_SCROLLER_ID}`,
}: PullToRefreshProps) {
  const [startY, setStartY] = useState(0)
  const [pulling, setPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [shouldAllowPull, setShouldAllowPull] = useState(false)

  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!pulling) {
      setPullDistance(0)
    }
  }, [pulling])
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const touchStartHandler = (e: TouchEvent) => {
      const scrollContainer = contentRef.current?.querySelector(
        scrollContainerSelector,
      ) as HTMLElement
      if (!scrollContainer) return

      const touchY = e.touches[0]!.clientY
      setStartY(touchY)

      if (scrollContainer.scrollTop <= 0) {
        setShouldAllowPull(true)
      } else {
        setShouldAllowPull(false)
      }
    }

    const touchMoveHandler = (e: TouchEvent) => {
      if (!shouldAllowPull || isRefreshing) return

      const y = e.touches[0]!.clientY
      const delta = y - startY

      if (delta > 0) {
        e.preventDefault()
        setPulling(true)
        setPullDistance(Math.min(delta, MAX_PULL_DISTANCE))
      }
    }

    const touchEndHandler = async () => {
      if (!pulling || isRefreshing) return

      setPulling(false)

      if (pullDistance >= THRESHOLD) {
        const promise = onRefresh()
        setIsRefreshing(true)

        try {
          await promise
        } finally {
          setIsRefreshing(false)
          setPullDistance(0)
        }
      }
    }

    element.addEventListener("touchstart", touchStartHandler, { passive: true })
    element.addEventListener("touchmove", touchMoveHandler, { passive: false })
    element.addEventListener("touchend", touchEndHandler, { passive: true })

    return () => {
      element.removeEventListener("touchstart", touchStartHandler)
      element.removeEventListener("touchmove", touchMoveHandler)
      element.removeEventListener("touchend", touchEndHandler)
    }
  }, [
    startY,
    shouldAllowPull,
    pulling,
    pullDistance,
    onRefresh,
    scrollContainerSelector,
    isRefreshing,
  ])

  // Calculate the actual pull-down distance
  const actualPullDistance = isRefreshing
    ? THRESHOLD // Stay at threshold position when refreshing
    : pullDistance

  // Calculate the pull-down progress (0-1)
  const pullProgress = Math.max(Math.min(pullDistance / THRESHOLD - 0.2, 1), 0)
  const SIZE = 24
  const STROKE_WIDTH = 2
  const RADIUS = (SIZE - STROKE_WIDTH) / 2
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const strokeDashoffset = CIRCUMFERENCE * (1 - pullProgress)

  return (
    <div ref={containerRef} className={clsx("relative touch-none", className)}>
      <div
        className={clsx(
          "absolute inset-x-0 flex items-center justify-center",
          actualPullDistance > 0 ? "opacity-100" : "opacity-0",
          !pulling && "duration-200",
        )}
        style={{
          transform: `translateY(${actualPullDistance - 60}px)`,
        }}
      >
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className={clsx(isRefreshing ? "animate-spin" : "")}
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE_WIDTH}
            className="stroke-zinc-500/70"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={isRefreshing ? 20 : strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Content area */}
      <div
        ref={contentRef}
        className={clsx("h-full will-change-transform", !pulling ? "transition-transform" : "")}
        style={{
          transform: `translateY(${actualPullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
