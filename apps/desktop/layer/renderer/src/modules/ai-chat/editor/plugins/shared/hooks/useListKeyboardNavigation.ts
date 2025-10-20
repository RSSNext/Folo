import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
} from "lexical"
import { useCallback, useEffect } from "react"

interface UseListKeyboardNavigationOptions {
  isActive: boolean
  itemCount: number
  selectedIndex: number
  onMove: (isUp: boolean) => void
  onConfirm: () => void
  onCancel: () => void
}

export const useListKeyboardNavigation = ({
  isActive,
  itemCount,
  selectedIndex,
  onMove,
  onConfirm,
  onCancel,
}: UseListKeyboardNavigationOptions) => {
  const [editor] = useLexicalComposerContext()

  const handleMove = useCallback(
    (isUp: boolean) => {
      if (!isActive || itemCount === 0) return false
      onMove(isUp)
      return true
    },
    [isActive, itemCount, onMove],
  )

  const handleConfirm = useCallback(() => {
    if (!isActive || itemCount === 0 || selectedIndex < 0 || selectedIndex >= itemCount) {
      return false
    }
    onConfirm()
    return true
  }, [isActive, itemCount, selectedIndex, onConfirm])

  const handleCancel = useCallback(() => {
    if (!isActive) return false
    onCancel()
    return true
  }, [isActive, onCancel])

  useEffect(() => {
    const remove = [
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        (event) => {
          if (isActive && itemCount > 0) {
            event.preventDefault()
            return handleMove(true)
          }
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        (event) => {
          if (isActive && itemCount > 0) {
            event.preventDefault()
            return handleMove(false)
          }
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          if (isActive && itemCount > 0 && selectedIndex >= 0 && selectedIndex < itemCount) {
            event?.preventDefault()
            return handleConfirm()
          }
          return false
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        KEY_TAB_COMMAND,
        (event) => {
          if (isActive && itemCount > 0 && selectedIndex >= 0 && selectedIndex < itemCount) {
            event.preventDefault()
            return handleConfirm()
          }
          return false
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        (event) => {
          if (isActive) {
            event.preventDefault()
            return handleCancel()
          }
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    ]

    return () => remove.forEach((fn) => fn())
  }, [editor, isActive, itemCount, selectedIndex, handleMove, handleConfirm, handleCancel])

  return { handleMove, handleConfirm, handleCancel }
}
