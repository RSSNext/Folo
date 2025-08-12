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
  const [editor] = useLexicalComposerContext()

  // Handle keyboard navigation
  const handleArrowKey = useCallback(
    (isUp: boolean) => {
      if (!isActive || suggestions.length === 0) return false
      onArrowKey(isUp)
      return true
    },
    [isActive, suggestions.length, onArrowKey],
  )

  // Handle enter key
  const handleEnterKey = useCallback(() => {
    if (
      !isActive ||
      suggestions.length === 0 ||
      selectedIndex < 0 ||
      selectedIndex >= suggestions.length
    ) {
      return false
    }
    onEnterKey()
    return true
  }, [isActive, suggestions.length, selectedIndex, onEnterKey])

  // Handle escape key
  const handleEscapeKey = useCallback(() => {
    if (!isActive) return false
    onEscapeKey()
    return true
  }, [isActive, onEscapeKey])

  // Register keyboard commands
  useEffect(() => {
    const removeCommands = [
      // Arrow key navigation
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        (event) => {
          if (isActive && suggestions.length > 0) {
            event.preventDefault()
            return handleArrowKey(true)
          }
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),

      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        (event) => {
          if (isActive && suggestions.length > 0) {
            event.preventDefault()
            return handleArrowKey(false)
          }
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),

      // Enter key
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          if (
            isActive &&
            suggestions.length > 0 &&
            selectedIndex >= 0 &&
            selectedIndex < suggestions.length
          ) {
            event?.preventDefault()
            return handleEnterKey()
          }
          return false
        },
        COMMAND_PRIORITY_HIGH,
      ),

      // Tab key (same as enter)
      editor.registerCommand(
        KEY_TAB_COMMAND,
        (event) => {
          if (
            isActive &&
            suggestions.length > 0 &&
            selectedIndex >= 0 &&
            selectedIndex < suggestions.length
          ) {
            event.preventDefault()
            return handleEnterKey()
          }
          return false
        },
        COMMAND_PRIORITY_HIGH,
      ),

      // Escape key
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        (event) => {
          if (isActive) {
            event.preventDefault()
            return handleEscapeKey()
          }
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    ]

    return () => {
      removeCommands.forEach((remove) => remove())
    }
  }, [
    editor,
    isActive,
    suggestions.length,
    selectedIndex,
    handleArrowKey,
    handleEnterKey,
    handleEscapeKey,
  ])

  return {
    handleArrowKey,
    handleEnterKey,
    handleEscapeKey,
  }
}
