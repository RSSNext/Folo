import { useCallback } from "react"

import { useListKeyboardNavigation } from "../../shared/hooks/useListKeyboardNavigation"
import type { MentionData } from "../types"

interface UseMentionKeyboardOptions {
  isActive: boolean
  suggestions: MentionData[]
  selectedIndex: number
  onArrowKey: (isUp: boolean) => void
  onEnterKey: () => void
  onEscapeKey: () => void
}

export const useMentionKeyboard = ({
  isActive,
  suggestions,
  selectedIndex,
  onArrowKey,
  onEnterKey,
  onEscapeKey,
}: UseMentionKeyboardOptions) => {
  const handleMove = useCallback((isUp: boolean) => onArrowKey(isUp), [onArrowKey])
  const {
    handleCancel,
    handleConfirm,
    handleMove: _,
  } = useListKeyboardNavigation({
    isActive,
    itemCount: suggestions.length,
    selectedIndex,
    onMove: handleMove,
    onConfirm: onEnterKey,
    onCancel: onEscapeKey,
  })

  return { handleArrowKey: _, handleEnterKey: handleConfirm, handleEscapeKey: handleCancel }
}
