import { useCallback } from "react"

import type { MentionData } from "../types"
import { useMentionBlockSync } from "./useMentionBlockSync"
import { useMentionSearchService } from "./useMentionSearchService"

/**
 * Hook that integrates mention search with context block management
 * Provides search functionality and handles bidirectional synchronization
 */
export const useMentionIntegration = () => {
  const { searchMentions } = useMentionSearchService()
  const { handleMentionInsert: syncMentionInsert } = useMentionBlockSync()

  // Handle mention insertion with node key tracking
  const handleMentionInsert = useCallback(
    (mention: MentionData, nodeKey?: string) => {
      if (nodeKey) {
        syncMentionInsert(mention, nodeKey)
      }
    },
    [syncMentionInsert],
  )

  return {
    searchMentions,
    handleMentionInsert,
  }
}
