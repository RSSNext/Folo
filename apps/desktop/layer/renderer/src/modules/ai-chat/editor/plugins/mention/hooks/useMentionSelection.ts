import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { COMMAND_PRIORITY_LOW } from "lexical"
import { useCallback, useEffect } from "react"

import { MENTION_COMMAND } from "../constants"
import type { MentionData, MentionMatch } from "../types"
import { insertMentionNode } from "../utils/textReplacement"

interface UseMentionSelectionOptions {
  mentionMatch: MentionMatch | null
  onMentionInsert?: (mention: MentionData, nodeKey?: string) => void
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

      let result: ReturnType<typeof insertMentionNode> = {
        success: false,
        nodeKey: undefined as string | undefined,
      }
      editor.update(() => {
        result = insertMentionNode(mentionData, mentionMatch)

        if (result.success && result.nodeKey) {
          // Call onMentionInsert immediately within the same editor update
          // to ensure the node tracking happens before any mutations
          onMentionInsert?.(mentionData, result.nodeKey)
        }
      })

      // Call onSelectionComplete after the editor update is complete
      if (result.success) {
        setTimeout(() => {
          onSelectionComplete?.()
        }, 0)
      }

      return result.success
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
