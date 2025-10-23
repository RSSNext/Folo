import { useCallback } from "react"

import { useListKeyboardNavigation } from "../../shared/hooks/useListKeyboardNavigation"
import type { ShortcutData } from "../types"

interface UseShortcutKeyboardOptions {
  isActive: boolean
  suggestions: ShortcutData[]
  selectedIndex: number
  onArrowKey: (isUp: boolean) => void
  onEnterKey: () => void
  onEscapeKey: () => void
}

export const useShortcutKeyboard = ({
  isActive,
  suggestions,
  selectedIndex,
  onArrowKey,
  onEnterKey,
  onEscapeKey,
}: UseShortcutKeyboardOptions) => {
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
