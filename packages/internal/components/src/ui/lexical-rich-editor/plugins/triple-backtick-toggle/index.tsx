import { $createCodeNode, $isCodeNode } from "@lexical/code"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import type { LexicalNode } from "lexical"
import {
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
} from "lexical"
import { useEffect } from "react"

function findAncestor(
  node: LexicalNode | null,
  predicate: (n: LexicalNode) => boolean,
): LexicalNode | null {
  let current: LexicalNode | null = node
  while (current) {
    if (predicate(current)) return current
    current = current.getParent()
  }
  return null
}

export function TripleBacktickTogglePlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const unregister = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (!event) return false

        // Phase 1 (read): decide intent without mutating editor
        const intent = editor.getEditorState().read(() => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) return null
          const focusNode = selection.focus.getNode()
          const topLevel = focusNode.getTopLevelElementOrThrow()

          // Toggle ON if paragraph is exactly ``` or ```lang
          if (topLevel.getType() === "paragraph") {
            const raw = topLevel.getTextContent()
            const text = raw.trim()
            const match = /^```([\w+-]+)?$/.exec(text)
            if (match) {
              return { type: "toggleOn" as const, lang: match[1] as string | undefined }
            }
          }

          // Shift+Enter inside a code block should exit the block
          const codeAncestor = findAncestor(focusNode, (n) => $isCodeNode(n))
          if (event.shiftKey && codeAncestor && $isCodeNode(codeAncestor)) {
            return { type: "exitCode" as const }
          }
          return null
        })

        if (!intent) return false

        // Phase 2 (write): perform mutation according to intent
        editor.update(() => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) return
          const focusNode = selection.focus.getNode()

          if (intent.type === "toggleOn") {
            const topLevel = focusNode.getTopLevelElementOrThrow()
            const codeNode = $createCodeNode(intent.lang)
            topLevel.replace(codeNode)
            codeNode.selectEnd()
          } else if (intent.type === "exitCode") {
            const codeAncestor = findAncestor(focusNode, (n) => $isCodeNode(n))
            if (codeAncestor && $isCodeNode(codeAncestor)) {
              const paragraph = $createParagraphNode()
              const text = $createTextNode("")
              paragraph.append(text)
              codeAncestor.insertAfter(paragraph)
              text.select()
            }
          }
        })

        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        return true
      },
      COMMAND_PRIORITY_HIGH,
    )

    return () => unregister()
  }, [editor])

  return null
}
