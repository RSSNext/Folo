import { useEffect, useRef, useState } from "react"

const DEFAULT_GRACE_PERIOD_MS = 1000

export const useScrollMarkReadGracePeriod = (
  refreshing: boolean,
  gracePeriodMs = DEFAULT_GRACE_PERIOD_MS,
) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wasRefreshingRef = useRef(refreshing)
  const [isScrollMarkReadPaused, setIsScrollMarkReadPaused] = useState(refreshing)

  useEffect(() => {
    const wasRefreshing = wasRefreshingRef.current
    wasRefreshingRef.current = refreshing

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (refreshing) {
      setIsScrollMarkReadPaused(true)
      return
    }

    if (!wasRefreshing) {
      setIsScrollMarkReadPaused(false)
      return
    }

    setIsScrollMarkReadPaused(true)
    timeoutRef.current = setTimeout(() => {
      setIsScrollMarkReadPaused(false)
      timeoutRef.current = null
    }, gracePeriodMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [gracePeriodMs, refreshing])

  return isScrollMarkReadPaused
}
