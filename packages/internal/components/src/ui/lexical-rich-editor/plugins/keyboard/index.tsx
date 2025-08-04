import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useEffect } from "react"

interface KeyboardPluginProps {
  onKeyDown?: (event: KeyboardEvent) => boolean
}

export function KeyboardPlugin({ onKeyDown }: KeyboardPluginProps) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!onKeyDown) return

    const handleKeyDown = (event: KeyboardEvent) => {
      onKeyDown(event)
    }

    return editor.registerRootListener((rootElement, prevRootElement) => {
      if (prevRootElement !== null) {
        prevRootElement.removeEventListener("keydown", handleKeyDown)
      }
      if (rootElement !== null) {
        rootElement.addEventListener("keydown", handleKeyDown)
      }
    })
  }, [editor, onKeyDown])

  return null
}
