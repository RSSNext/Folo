import { nextFrame } from "@follow/utils/dom"
import { throttle } from "es-toolkit/compat"
import { useCallback, useLayoutEffect, useRef, useState } from "react"

import { getCurrentColumn } from "./utils"

const calItemWidth = (clientWidth: number, gutter: number, column: number) =>
  Math.trunc(clientWidth - gutter * (column - 1)) / column
export const useMasonryColumn = (gutter: number, onReady?: (column: number) => any) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentColumn, setCurrentColumn] = useState(1)
  const [currentItemWidth, setCurrentItemWidth] = useState(0)

  useLayoutEffect(() => {
    let readyCallOnce = false
    const $warpper = containerRef.current
    if (!$warpper) return

    const handler = () => {
      // Skip if element doesn't have proper dimensions yet
      if ($warpper.clientWidth === 0) return

      const column = getCurrentColumn($warpper.clientWidth)

      setCurrentItemWidth(calItemWidth($warpper.clientWidth, gutter, column))

      setCurrentColumn(column)

      nextFrame(() => {
        if (readyCallOnce) return
        readyCallOnce = true
        onReady?.(column)
      })
    }
    const recal = throttle(handler, 1000 / 12)

    let previousWidth = $warpper.offsetWidth
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width

        if (newWidth !== previousWidth && newWidth > 0) {
          previousWidth = newWidth

          recal()
        }
      }
    })

    // Use nextFrame to ensure DOM is ready before initial calculation
    nextFrame(() => {
      recal()
    })

    resizeObserver.observe($warpper)
    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return {
    containerRef,
    currentColumn,
    currentItemWidth,
    calcItemWidth: useCallback(
      (column: number) => {
        const $warpper = containerRef.current
        if (!$warpper) return 0
        return calItemWidth($warpper.clientWidth, gutter, column)
      },
      [gutter],
    ),
  }
}
