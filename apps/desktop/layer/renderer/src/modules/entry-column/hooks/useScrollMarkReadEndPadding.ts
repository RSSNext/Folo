import { getScrollMarkReadEndPadding } from "@follow/shared/scroll-mark-read"
import { useEffect, useState } from "react"

export const useScrollMarkReadEndPadding = (
  scrollElement: HTMLElement | null,
  enabled: boolean,
) => {
  const [padding, setPadding] = useState(() => getScrollMarkReadEndPadding(null))

  useEffect(() => {
    if (!enabled || !scrollElement) {
      return
    }

    const updatePadding = () => {
      setPadding(getScrollMarkReadEndPadding(scrollElement.clientHeight))
    }

    updatePadding()

    const observer = new ResizeObserver(updatePadding)
    observer.observe(scrollElement)

    return () => {
      observer.disconnect()
    }
  }, [enabled, scrollElement])

  return enabled ? padding : 0
}
