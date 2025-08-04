import { useCallback } from "react"

import { useChatBlockActions } from "~/modules/ai/chat/__internal__/hooks"

import { useMentionSearchService } from "../services/mentionSearchService"
import type { MentionData } from "../types"

/**
 * Hook that integrates mention search with context block management
 * Provides search functionality and handles automatic context block addition
 */
export const useMentionIntegration = () => {
  const { searchMentions } = useMentionSearchService()
  const blockActions = useChatBlockActions()

  // Handle mention insertion - automatically add to context blocks
  const handleMentionInsert = useCallback(
    (mention: MentionData) => {
      if (mention.type === "feed") {
        blockActions.addBlock({
          type: "referFeed",
          value: mention.id,
        })
      } else if (mention.type === "entry") {
        blockActions.addBlock({
          type: "referEntry",
          value: mention.id,
        })
      }
    },
    [blockActions],
  )

  return {
    searchMentions,
    handleMentionInsert,
  }
}
