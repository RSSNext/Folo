import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import type { LexicalEditor } from "lexical"
import { $getSelection, $isRangeSelection, $isTextNode } from "lexical"
import { useCallback, useEffect, useState } from "react"

import type { MentionMatch } from "../types"
import { defaultTriggerFn } from "../utils/triggerDetection"

interface UseMentionTriggerOptions {
  triggerFn?: (text: string, editor: LexicalEditor) => MentionMatch | null
  onTrigger?: (match: MentionMatch | null) => void
}

export const useMentionTrigger = ({
  triggerFn = defaultTriggerFn,
  onTrigger,
}: UseMentionTriggerOptions = {}) => {
  const [editor] = useLexicalComposerContext()
  const [mentionMatch, setMentionMatch] = useState<MentionMatch | null>(null)

  const updateMentionMatch = useCallback(
    (match: MentionMatch | null) => {
      setMentionMatch(match)
      onTrigger?.(match)
    },
    [onTrigger],
  )

  const clearMentionMatch = useCallback(() => {
    updateMentionMatch(null)
  }, [updateMentionMatch])

  // Monitor text changes for mention triggers
  useEffect(() => {
    const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          updateMentionMatch(null)
          return
        }

        const { anchor } = selection
        const anchorNode = anchor.getNode()

        if (!$isTextNode(anchorNode)) {
          updateMentionMatch(null)
          return
        }

        const textContent = anchorNode.getTextContent()
        const match = triggerFn(textContent, editor)
        updateMentionMatch(match)
      })
    })

    return removeUpdateListener
  }, [editor, triggerFn, updateMentionMatch])

  return {
    mentionMatch,
    isActive: mentionMatch !== null,
    clearMentionMatch,
  }
}
