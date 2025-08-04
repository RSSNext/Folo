import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { COMMAND_PRIORITY_LOW } from "lexical"
import { useCallback, useEffect } from "react"

import { MENTION_COMMAND } from "../constants"
import type { MentionData, MentionMatch } from "../types"
import { insertMentionNode } from "../utils/textReplacement"

interface UseMentionSelectionOptions {
  mentionMatch: MentionMatch | null
  onMentionInsert?: (mention: MentionData) => void
  onSelectionComplete?: () => void
}

export const useMentionSelection = ({
  mentionMatch,
  onMentionInsert,
  onSelectionComplete,
}: UseMentionSelectionOptions) => {
  const [editor] = useLexicalComposerContext()

  const selectMention = useCallback(
    (mentionData: MentionData) => {
      if (!mentionMatch) return false

      let success = false
      editor.update(() => {
        success = insertMentionNode(mentionData, mentionMatch)
      })

      if (success) {
        onMentionInsert?.(mentionData)
        onSelectionComplete?.()
      }

      return success
    },
    [editor, mentionMatch, onMentionInsert, onSelectionComplete],
  )

  // Register mention command
  useEffect(() => {
    const removeMentionCommand = editor.registerCommand(
      MENTION_COMMAND,
      (mentionData: MentionData) => {
        return selectMention(mentionData)
      },
      COMMAND_PRIORITY_LOW,
    )

    return removeMentionCommand
  }, [editor, selectMention])

  return {
    selectMention,
  }
}
