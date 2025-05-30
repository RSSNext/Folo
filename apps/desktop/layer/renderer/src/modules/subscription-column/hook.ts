import { useDndContext } from "@dnd-kit/core"

import { useFeedAreaScrollProgressValue } from "./atom"

export function useShouldFreeUpSpace() {
  const dndContext = useDndContext()
  const isDragging = !!dndContext.active
  const scrollProgress = useFeedAreaScrollProgressValue()
  return isDragging && scrollProgress === 0
}
