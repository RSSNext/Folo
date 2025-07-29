import { useEffect, useRef } from "react"
import { useIsomorphicLayoutEffect } from "usehooks-ts"

export function useAccurateInterval(
  callback: () => void,
  options: {
    delay: number
    enable?: boolean
    immediately?: boolean
  },
) {
  const { delay, enable = true, immediately = true } = options
  const savedCallback = useRef(callback)
  const nextTick = useRef(Date.now() + (delay || 0))

  const triggerCountRef = useRef(0)

  const timerRef = useRef<any | null | undefined>(null)

  // Remember the latest callback if it changes.
  useIsomorphicLayoutEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval.
  useEffect(() => {
    if (!enable) return
    // Don't schedule if no delay is specified.
    // Note: 0 is a valid value for delay.
    if (!delay && delay !== 0) {
      return
    }

    function tick() {
      if (immediately || triggerCountRef.current > 0) {
        savedCallback.current()
      }
      triggerCountRef.current++

      const now = Date.now()
      const expectedNextTick = nextTick.current
      const actualDelay = Math.max(0, expectedNextTick - now)

      // Compensate for the time taken by the task
      nextTick.current = now + delay + actualDelay
      timerRef.current = setTimeout(tick, nextTick.current - now)
    }

    tick()

    return () => {
      nextTick.current = Date.now() // Reset for the next run
      timerRef.current = clearTimeout(timerRef.current)
    }
  }, [delay, enable, immediately])
}
