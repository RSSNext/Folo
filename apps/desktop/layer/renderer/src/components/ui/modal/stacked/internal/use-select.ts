import { nextFrame } from "@follow/utils/dom"
import { useCallback, useRef } from "react"

/**
 * @internal
 *
 * Handle select text in modal
 */
export const useModalSelect = () => {
  const isSelectingRef = useRef(false)
  const handleSelectStart = useCallback(() => {
    isSelectingRef.current = true
  }, [])
  const handleDetectSelectEnd = useCallback(() => {
    nextFrame(() => {
      if (isSelectingRef.current) {
        isSelectingRef.current = false
      }
    })
  }, [])

  return {
    isSelectingRef,
    handleSelectStart,
    handleDetectSelectEnd,
  }
}
