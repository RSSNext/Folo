import { useCallback, useRef, useState, useTransition } from "react"

import { DEFAULT_MAX_SUGGESTIONS } from "../constants"
import type { MentionData, MentionSearchState, MentionType } from "../types"
import { getMentionType, shouldTriggerMention } from "../utils/triggerDetection"

interface UseMentionSearchOptions {
  onSearch?: (
    query: string,
    type: MentionType | undefined,
  ) => Promise<MentionData[]> | MentionData[]
  maxSuggestions?: number
}

// Default search function
const defaultSearchFn = async (): Promise<MentionData[]> => []

export const useMentionSearch = ({
  onSearch = defaultSearchFn,
  maxSuggestions = DEFAULT_MAX_SUGGESTIONS,
}: UseMentionSearchOptions = {}) => {
  const [searchState, setSearchState] = useState<MentionSearchState>({
    suggestions: [],
    selectedIndex: -1,
    isLoading: false,
  })

  const [isPending, startTransition] = useTransition()
  const onSearchRef = useRef(onSearch)
  const maxSuggestionsRef = useRef(maxSuggestions)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Update refs when props change to avoid stale closures
  onSearchRef.current = onSearch
  maxSuggestionsRef.current = maxSuggestions

  const searchMentions = useCallback(
    async (query: string) => {
      // Cancel any pending search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      if (!shouldTriggerMention(query)) {
        setSearchState((prev) => ({
          ...prev,
          suggestions: [],
          selectedIndex: -1,
          isLoading: false,
        }))
        return
      }

      // Create new abort controller for this search
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      // Use transition to defer search as low-priority update
      startTransition(() => {
        setSearchState((prev) => ({ ...prev, isLoading: true }))
      })

      try {
        const [mentionType, cleanQuery] = getMentionType(query)

        const results = await onSearchRef.current(cleanQuery, mentionType)

        // Check if this search was aborted
        if (abortController.signal.aborted) {
          return
        }

        startTransition(() => {
          setSearchState({
            suggestions: results.slice(0, maxSuggestionsRef.current),
            selectedIndex: results.length > 0 ? 0 : -1,
            isLoading: false,
          })
        })
      } catch (error) {
        // Check if this search was aborted
        if (abortController.signal.aborted) {
          return
        }

        console.error("Error searching mentions:", error)
        startTransition(() => {
          setSearchState({
            suggestions: [],
            selectedIndex: -1,
            isLoading: false,
          })
        })
      }
    },
    [], // Empty deps array - we use refs to avoid dependency issues
  )

  const clearSuggestions = useCallback(() => {
    setSearchState({
      suggestions: [],
      selectedIndex: -1,
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
    isLoading: searchState.isLoading || isPending,
  }
}
