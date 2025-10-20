import { $isCodeNode } from "@lexical/code"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_NORMAL,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ENTER_COMMAND,
} from "lexical"
import { useEffect } from "react"

/**
 * Handles exiting from inline and block code contexts:
 * - Inline code: Enter or ArrowRight at the end inserts a space after the code span and moves caret there.
 * - Block code: ArrowRight at the end inserts an empty paragraph after the code block and moves caret there.
 */
export function ExitCodeBoundaryPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // Enter inside inline code at end → insert a trailing space outside code
    const unregisterEnter = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        let handled = false
        editor.update(() => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) return

          const focusNode = selection.focus.getNode()
          if ($isTextNode(focusNode) && focusNode.hasFormat("code")) {
            const atEnd = selection.focus.offset === focusNode.getTextContentSize()
            if (atEnd) {
              const space = $createTextNode(" ") // outside code format
              // Insert after current code-formatted text node
              focusNode.insertAfter(space)
              // Place caret after inserted space
              space.select(1, 1)
              handled = true
            }
          }
        })
        if (handled) {
          if (event) {
            event.preventDefault()
            event.stopPropagation()
          }
          return true
        }
        return false
      },
      COMMAND_PRIORITY_NORMAL,
    )

    // ArrowRight inside inline code at end → same as Enter behavior
    const unregisterArrowRight = editor.registerCommand(
      KEY_ARROW_RIGHT_COMMAND,
      (event) => {
        let handled = false
        editor.update(() => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) return

          const focusNode = selection.focus.getNode()

          // 1) Inline code span end → insert space outside code
          if ($isTextNode(focusNode) && focusNode.hasFormat("code")) {
            const atEnd = selection.focus.offset === focusNode.getTextContentSize()
            if (atEnd) {
              const space = $createTextNode(" ")
              focusNode.insertAfter(space)
              space.select(1, 1)
              handled = true
              return
            }
          }

          // 2) Block code (CodeNode) end → insert empty paragraph after code block
          const codeAncestor = focusNode.getParent()
          if (codeAncestor && $isCodeNode(codeAncestor)) {
            // Heuristic: only exit when the caret is at the very end of the last descendant
            const lastDescendant = codeAncestor.getLastDescendant()
            if ($isTextNode(lastDescendant)) {
              const isAtEnd =
                lastDescendant.getKey() === selection.focus.getNode().getKey() &&
                selection.focus.offset === lastDescendant.getTextContentSize()
              if (isAtEnd) {
                const paragraph = $createParagraphNode()
                const text = $createTextNode("")
                paragraph.append(text)
                // Insert after the code block and move caret into the new empty line
                codeAncestor.insertAfter(paragraph)
                text.select(0, 0)
                handled = true
              }
            }
          }
        })
        if (handled) {
          if (event) {
            event.preventDefault()
            event.stopPropagation()
          }
          return true
        }
        return false
      },
      COMMAND_PRIORITY_NORMAL,
    )

    return () => {
      unregisterEnter()
      unregisterArrowRight()
    }
  }, [editor])

  return null
}
