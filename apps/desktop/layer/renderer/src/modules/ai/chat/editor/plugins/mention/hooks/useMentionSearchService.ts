import { useMemo } from "react"

import { useFeedEntrySearchService } from "~/modules/ai/chat/services/feedEntrySearchService"

import type { MentionData, MentionType } from "../types"

/**
 * Hook that provides search functionality for mentions
 * Uses the shared feed/entry search service
 */
export const useMentionSearchService = () => {
  const { search } = useFeedEntrySearchService({
    maxRecentEntries: 50,
  })

  // Search function that converts search results to MentionData format
  const searchMentions = useMemo(() => {
    return async (query: string, type?: MentionType): Promise<MentionData[]> => {
      const searchResults = search(query, type, 10)

      // Convert to MentionData format
      return searchResults.map(
        (item): MentionData => ({
          id: item.id,
          name: item.title,
          type: item.type as MentionType,
          value: item.id,
        }),
      )
    }
  }, [search])

  return { searchMentions }
}
