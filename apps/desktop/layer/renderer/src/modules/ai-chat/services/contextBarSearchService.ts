import { useMemo } from "react"

import type { SearchItem } from "./feedEntrySearchService"
import { useFeedEntrySearchService } from "./feedEntrySearchService"

/**
 * Picker item interface for context bar compatibility
 */
export interface PickerItem {
  id: string
  title: string
}

/**
 * Hook that provides search functionality for context bar
 * Uses the shared feed/entry search service and converts results to PickerItem format
 */
export const useContextBarSearchService = () => {
  const { search, feedItems, entryItems } = useFeedEntrySearchService({
    maxRecentEntries: 50,
    fuseOptions: {
      keys: ["title", "id"],
      threshold: 0.3,
    },
  })

  // Convert search items to picker items
  const convertToPickerItems = useMemo(() => {
    return (items: SearchItem[]): PickerItem[] => {
      return items.map((item) => ({
        id: item.id,
        title: item.title,
      }))
    }
  }, [])

  // Search function for feeds
  const searchFeeds = useMemo(() => {
    return (query: string): PickerItem[] => {
      const results = search(query, "feed", 20)
      return convertToPickerItems(results)
    }
  }, [search, convertToPickerItems])

  // Search function for entries
  const searchEntries = useMemo(() => {
    return (query: string): PickerItem[] => {
      const results = search(query, "entry", 20)
      return convertToPickerItems(results)
    }
  }, [search, convertToPickerItems])

  // Get all feeds as picker items
  const allFeeds = useMemo(() => {
    return convertToPickerItems(feedItems)
  }, [feedItems, convertToPickerItems])

  // Get all recent entries as picker items
  const allRecentEntries = useMemo(() => {
    return convertToPickerItems(entryItems)
  }, [entryItems, convertToPickerItems])

  return {
    searchFeeds,
    searchEntries,
    allFeeds,
    allRecentEntries,
  }
}
