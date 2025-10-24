import type { RefObject } from "react"
import { startTransition, useLayoutEffect, useState } from "react"

/**
 * Hook to track the width of an element using ResizeObserver
 * @param ref - RefObject pointing to the element to observe
 * @returns The current width of the element (0 if element is not available)
 */
export function useElementWidth<T extends HTMLElement>(ref: RefObject<T | null>): number {
  const [width, setWidth] = useState<number>(0)

  useLayoutEffect(() => {
    if (!ref.current) return

    const updateWidth = (newWidth: number) => {
      startTransition(() => {
        setWidth(newWidth)
      })
    }

    // Set initial width
    updateWidth(ref.current.clientWidth)

    // Create ResizeObserver to track width changes
    const resizeObserver = new ResizeObserver(() => {
      if (ref.current) {
        updateWidth(ref.current.clientWidth)
      }
    })

    resizeObserver.observe(ref.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [ref])

  return width
}
