import { useSetAtom } from "jotai"
import { useCallback, useEffect } from "react"

import { SCROLLED_BEYOND_THRESHOLD } from "../constants"
import { useAIRootState } from "../store/AIChatContext"
import { useCurrentChatId } from "../store/hooks"

export const useAttachScrollBeyond = () => {
  const { isScrolledBeyondThreshold } = useAIRootState()
  const setIsScrolledBeyondThreshold = useSetAtom(isScrolledBeyondThreshold)
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop } = event.currentTarget
      setIsScrolledBeyondThreshold(scrollTop > SCROLLED_BEYOND_THRESHOLD)
    },
    [setIsScrolledBeyondThreshold],
  )
  const currentChatId = useCurrentChatId()
  useEffect(() => {
    if (currentChatId) {
      setIsScrolledBeyondThreshold(false)
    }
  }, [currentChatId, setIsScrolledBeyondThreshold])
  return { handleScroll }
}
