import { useCallback, useEffect, useRef, useState } from "react"

const DEFAULT_GRACE_PERIOD_MS = 1000

export const useScrollMarkReadGracePeriod = (
  refreshing: boolean,
  gracePeriodMs = DEFAULT_GRACE_PERIOD_MS,
  pauseKey?: unknown,
) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wasRefreshingRef = useRef(refreshing)
  const refreshingRef = useRef(refreshing)
  const pauseKeyRef = useRef(pauseKey)
  const [isScrollMarkReadPaused, setIsScrollMarkReadPaused] = useState(refreshing)

  refreshingRef.current = refreshing

  const clearPauseTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const pauseForGracePeriod = useCallback(() => {
    clearPauseTimeout()
    setIsScrollMarkReadPaused(true)
    timeoutRef.current = setTimeout(() => {
      if (!refreshingRef.current) {
        setIsScrollMarkReadPaused(false)
      }
      timeoutRef.current = null
    }, gracePeriodMs)
  }, [clearPauseTimeout, gracePeriodMs])

  useEffect(() => {
    const wasRefreshing = wasRefreshingRef.current
    wasRefreshingRef.current = refreshing

    clearPauseTimeout()

    if (refreshing) {
      setIsScrollMarkReadPaused(true)
      return
    }

    if (!wasRefreshing) {
      setIsScrollMarkReadPaused(false)
      return
    }

    pauseForGracePeriod()

    return () => {
      clearPauseTimeout()
    }
  }, [clearPauseTimeout, pauseForGracePeriod, refreshing])

  useEffect(() => {
    if (Object.is(pauseKeyRef.current, pauseKey)) {
      return
    }

    pauseKeyRef.current = pauseKey
    pauseForGracePeriod()

    return () => {
      clearPauseTimeout()
    }
  }, [clearPauseTimeout, pauseForGracePeriod, pauseKey])

  return isScrollMarkReadPaused
}
