import type { LexicalEditor } from "lexical"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
} from "lexical"

import type { SelectedTextNodePayload } from "./SelectedTextNode"
import { $createSelectedTextNode } from "./SelectedTextNode"

export function insertSelectedTextNode(editor: LexicalEditor, payload: SelectedTextNodePayload) {
  editor.update(() => {
    let selection = $getSelection()

    if (!$isRangeSelection(selection)) {
      const root = $getRoot()
      const paragraph = $createParagraphNode()
      root.append(paragraph)
      paragraph.selectEnd()
      selection = $getSelection()
    }

    if (!selection) return
    const selectedNode = $createSelectedTextNode(payload)
    selection.insertNodes([selectedNode, $createTextNode(" ")])
  })
}
