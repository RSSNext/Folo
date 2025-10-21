import { useCallback, useRef, useState, useTransition } from "react"

import { DEFAULT_MAX_SHORTCUT_SUGGESTIONS } from "../constants"
import type { ShortcutData, ShortcutSearchState } from "../types"
import { cleanShortcutQuery, shouldTriggerShortcut } from "../utils/triggerDetection"

interface UseShortcutSearchOptions {
  onSearch?: (query: string) => Promise<ShortcutData[]> | ShortcutData[]
  maxSuggestions?: number
}

const defaultSearchFn = async (): Promise<ShortcutData[]> => []

export const useShortcutSearch = ({
  onSearch = defaultSearchFn,
  maxSuggestions = DEFAULT_MAX_SHORTCUT_SUGGESTIONS,
}: UseShortcutSearchOptions = {}) => {
  const [searchState, setSearchState] = useState<ShortcutSearchState>({
    suggestions: [],
    selectedIndex: -1,
    isLoading: false,
  })

  const [isPending, startTransition] = useTransition()
  const onSearchRef = useRef(onSearch)
  const maxSuggestionsRef = useRef(maxSuggestions)

  onSearchRef.current = onSearch
  maxSuggestionsRef.current = maxSuggestions

  const searchShortcuts = useCallback(async (query: string) => {
    if (!shouldTriggerShortcut(query)) {
      setSearchState((prev) => ({
        ...prev,
        suggestions: [],
        selectedIndex: -1,
        isLoading: false,
      }))
      return
    }

    startTransition(() => {
      setSearchState((prev) => ({ ...prev, isLoading: true }))
    })

    try {
      const cleanQuery = cleanShortcutQuery(query)
      const results = await onSearchRef.current(cleanQuery)

      startTransition(() => {
        setSearchState({
          suggestions: results.slice(0, maxSuggestionsRef.current),
          selectedIndex: results.length > 0 ? 0 : -1,
          isLoading: false,
        })
      })
    } catch (error) {
      console.error("Error searching shortcuts:", error)
      startTransition(() => {
        setSearchState({
          suggestions: [],
          selectedIndex: -1,
          isLoading: false,
        })
      })
    }
  }, [])

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
    searchShortcuts,
    clearSuggestions,
    setSelectedIndex,
    hasResults: searchState.suggestions.length > 0,
    isLoading: searchState.isLoading || isPending,
  }
}
