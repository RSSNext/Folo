import { registerCodeHighlighting } from "@lexical/code"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useEffect } from "react"

export function CodeHighlightingPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const unregister = registerCodeHighlighting(editor)
    return () => unregister()
  }, [editor])

  return null
}
