import { jotaiStore } from "@follow/utils"
import { atom } from "jotai"
import { useEffect } from "react"

const LCPEndAtom = atom(false)

/**
 * To skip page transition when first load, improve LCP
 */
export const LCPEndDetector = () => {
  useEffect(() => {
    let hasEnded = false

    const timeoutIds: Array<ReturnType<typeof setTimeout>> = []
    const rafIds: number[] = []
    const idleCallbackIds: number[] = []

    const scheduleRaf = (cb: FrameRequestCallback) => {
      if (typeof window !== "undefined" && window.requestAnimationFrame) {
        const id = window.requestAnimationFrame(cb)
        rafIds.push(id)
      } else {
        const id = setTimeout(() => cb(performance.now()), 16)
        timeoutIds.push(id)
      }
    }

    const markEnded = () => {
      if (hasEnded) return
      hasEnded = true

      // Defer to ensure layout/paint and initial CSS transitions settle
      scheduleRaf(() => {
        scheduleRaf(() => {
          // Prefer idle if available to avoid jank
          const ric = (typeof window !== "undefined" && (window as any).requestIdleCallback) as
            | ((cb: () => void, opts?: { timeout?: number }) => number)
            | undefined
          if (ric) {
            const id = ric(() => jotaiStore.set(LCPEndAtom, true), {
              timeout: 200,
            }) as unknown as number
            idleCallbackIds.push(id)
          } else {
            const id = setTimeout(() => jotaiStore.set(LCPEndAtom, true), 0)
            timeoutIds.push(id)
          }
        })
      })
    }

    // If PerformanceObserver for LCP is available, prefer it
    const supportsPO = typeof PerformanceObserver !== "undefined"
    let po: PerformanceObserver | undefined

    const onHidden = () => markEnded()
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") onHidden()
    }
    const onPageHide = onHidden
    const onLoad = () => markEnded()

    let safetyTimer: ReturnType<typeof setTimeout> | undefined
    let fallbackEndTimer: ReturnType<typeof setTimeout> | undefined

    if (supportsPO) {
      try {
        po = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          if (entries && entries.length > 0) {
            // Any LCP entry indicates a meaningful paint; we can mark end soon
            markEnded()
          }
        })
        // buffered: true ensures we get entries that occurred before observer creation
        po.observe({ type: "largest-contentful-paint", buffered: true } as PerformanceObserverInit)
      } catch {
        // Ignore observer errors and rely on fallback
      }

      // When the page is hidden or unloaded, LCP is finalized
      window.addEventListener("visibilitychange", onVisibilityChange, { once: true })
      window.addEventListener("pagehide", onPageHide, { once: true })
      window.addEventListener("load", onLoad, { once: true })

      // Absolute safety net: if nothing fires, end after 3s
      safetyTimer = setTimeout(() => markEnded(), 3000)
      timeoutIds.push(safetyTimer)
    } else {
      // Ultimate fallback for environments without PO
      fallbackEndTimer = setTimeout(() => {
        jotaiStore.set(LCPEndAtom, true)
      }, 2000)
      timeoutIds.push(fallbackEndTimer)
    }

    return () => {
      if (po) po.disconnect()
      const caf = typeof window !== "undefined" && window.cancelAnimationFrame
      if (caf) {
        rafIds.forEach((id) => (window.cancelAnimationFrame as (h: number) => void)(id))
      }
      const cic = (typeof window !== "undefined" && (window as any).cancelIdleCallback) as
        | ((id: number) => void)
        | undefined
      if (cic) idleCallbackIds.forEach((id) => cic(id))
      timeoutIds.forEach((id) => clearTimeout(id))
      if (safetyTimer) clearTimeout(safetyTimer)
      if (fallbackEndTimer) clearTimeout(fallbackEndTimer)

      window.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("pagehide", onPageHide)
      window.removeEventListener("load", onLoad)
    }
  }, [])
  return null
}

// eslint-disable-next-line react-refresh/only-export-components
export const isLCPEnded = () => jotaiStore.get(LCPEndAtom)
