import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useEffect } from "react"

import { insertSelectedTextNode } from "./insertSelectedTextNode"
import { subscribeSelectedTextInsertion } from "./selectedTextBridge"
import { SelectedTextNode } from "./SelectedTextNode"

export function SelectedTextPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return subscribeSelectedTextInsertion((payload) => {
      editor.focus()
      insertSelectedTextNode(editor, payload)
    })
  }, [editor])

  return null
}

SelectedTextPlugin.id = "selected-text"
SelectedTextPlugin.nodes = [SelectedTextNode]
