import { useSetAtom } from "jotai"
import { useCallback } from "react"

import { useEntryRootState } from "../store/EntryColumnContext"

const DEFAULT_THRESHOLD = 30

export const useAttachScrollBeyond = (threshold: number = DEFAULT_THRESHOLD) => {
  const { isScrolledBeyondThreshold } = useEntryRootState()
  const setIsScrolledBeyondThreshold = useSetAtom(isScrolledBeyondThreshold)

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop } = event.currentTarget
      setIsScrolledBeyondThreshold(scrollTop > threshold)
    },
    [setIsScrolledBeyondThreshold, threshold],
  )

  return { handleScroll }
}
