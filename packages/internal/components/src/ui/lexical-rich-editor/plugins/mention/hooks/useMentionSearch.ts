import { useCallback, useState } from "react"

import { DEFAULT_MAX_SUGGESTIONS, MOCK_MENTION_DATA } from "../constants"
import type { MentionData, MentionSearchState,MentionType } from "../types"
import { cleanQuery,getMentionType, shouldTriggerMention } from "../utils/triggerDetection"

interface UseMentionSearchOptions {
  onSearch?: (query: string, type: MentionType) => Promise<MentionData[]> | MentionData[]
  maxSuggestions?: number
}

// Default search function
const defaultSearchFn = async (query: string, type: MentionType): Promise<MentionData[]> => {
  const cleanedQuery = cleanQuery(query)
  const items = MOCK_MENTION_DATA[type] || []

  if (!cleanedQuery) {
    return items.slice(0, 5)
  }

  return items.filter((item) => item.name.toLowerCase().includes(cleanedQuery)).slice(0, 5)
}

export const useMentionSearch = ({
  onSearch = defaultSearchFn,
  maxSuggestions = DEFAULT_MAX_SUGGESTIONS,
}: UseMentionSearchOptions = {}) => {
  const [searchState, setSearchState] = useState<MentionSearchState>({
    suggestions: [],
    selectedIndex: 0,
    isLoading: false,
  })

  const searchMentions = useCallback(
    async (query: string) => {
      if (!shouldTriggerMention(query)) {
        setSearchState((prev) => ({ ...prev, suggestions: [], selectedIndex: 0 }))
        return
      }

      setSearchState((prev) => ({ ...prev, isLoading: true }))
      
      try {
        const mentionType = getMentionType(query)
        const results = await onSearch(query, mentionType)
        setSearchState({
          suggestions: results.slice(0, maxSuggestions),
          selectedIndex: 0,
          isLoading: false,
        })
      } catch (error) {
        console.error("Error searching mentions:", error)
        setSearchState({
          suggestions: [],
          selectedIndex: 0,
          isLoading: false,
        })
      }
    },
    [onSearch, maxSuggestions],
  )

  const clearSuggestions = useCallback(() => {
    setSearchState({
      suggestions: [],
      selectedIndex: 0,
      isLoading: false,
    })
  }, [])

  const setSelectedIndex = useCallback((index: number) => {
    setSearchState((prev) => ({ ...prev, selectedIndex: index }))
  }, [])

  return {
    ...searchState,
    searchMentions,
    clearSuggestions,
    setSelectedIndex,
    hasResults: searchState.suggestions.length > 0,
  }
}