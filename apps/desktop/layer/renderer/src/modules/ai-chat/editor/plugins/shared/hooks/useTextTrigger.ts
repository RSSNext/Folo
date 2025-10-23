import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import type { LexicalEditor } from "lexical"
import { $getSelection, $isRangeSelection, $isTextNode } from "lexical"
import { useCallback, useEffect, useState } from "react"

export interface TriggerMatch {
  leadOffset: number
  matchingString: string
  replaceableString: string
}

export interface UseTextTriggerOptions {
  triggerFn: (text: string, editor: LexicalEditor) => TriggerMatch | null
  onTrigger?: (match: TriggerMatch | null) => void
}

export const useTextTrigger = ({ triggerFn, onTrigger }: UseTextTriggerOptions) => {
  const [editor] = useLexicalComposerContext()
  const [match, setMatch] = useState<TriggerMatch | null>(null)

  const update = useCallback(
    (m: TriggerMatch | null) => {
      setMatch(m)
      onTrigger?.(m)
    },
    [onTrigger],
  )

  const clear = useCallback(() => update(null), [update])

  useEffect(() => {
    const remove = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          update(null)
          return
        }
        const { anchor } = selection
        const anchorNode = anchor.getNode()
        if (!$isTextNode(anchorNode)) {
          update(null)
          return
        }
        const textContent = anchorNode.getTextContent()
        const m = triggerFn(textContent, editor)
        update(m)
      })
    })
    return remove
  }, [editor, triggerFn, update])

  return { match, isActive: match !== null, clear }
}
