import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { COMMAND_PRIORITY_LOW, KEY_ENTER_COMMAND } from "lexical"
import { useEffect } from "react"

interface KeyboardPluginProps {
  onKeyDown?: (event: KeyboardEvent) => boolean
}

export function KeyboardPlugin({ onKeyDown }: KeyboardPluginProps) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!onKeyDown) return

    // Register a low-priority command that will only execute if no higher-priority commands handle the event
    const removeEnterCommand = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        // This will only be called if no higher-priority commands handled the Enter key
        if (!event) return false
        const handled = onKeyDown(event)
        return handled
      },
      COMMAND_PRIORITY_LOW,
    )

    // For other keys, use DOM event listener
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip Enter key as it's handled by the command system
      if (event.key === "Enter") return

      const handled = onKeyDown(event)
      if (handled) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    const removeRootListener = editor.registerRootListener((rootElement, prevRootElement) => {
      if (prevRootElement !== null) {
        prevRootElement.removeEventListener("keydown", handleKeyDown)
      }
      if (rootElement !== null) {
        rootElement.addEventListener("keydown", handleKeyDown)
      }
    })

    return () => {
      removeEnterCommand()
      removeRootListener()
    }
  }, [editor, onKeyDown])

  return null
}
