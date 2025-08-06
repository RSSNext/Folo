import { useEntryIdsByView } from "@follow/store/entry/hooks"
import { useEntryStore } from "@follow/store/entry/store"
import { getFeedById } from "@follow/store/feed/getter"
import { useAllFeedSubscription } from "@follow/store/subscription/hooks"
import type { IFuseOptions } from "fuse.js"
import Fuse from "fuse.js"
import { useMemo } from "react"

import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"

/**
 * Generic search item interface
 */
export interface SearchItem {
  id: string
  title: string
  type: "feed" | "entry"
}

/**
 * Search service options
 */
export interface SearchServiceOptions {
  /** Maximum number of recent entries to include */
  maxRecentEntries?: number
  /** Fuse.js search options */
  fuseOptions?: IFuseOptions<SearchItem>
}

const defaultFuseOptions: IFuseOptions<SearchItem> = {
  keys: ["title", "id"],
  threshold: 0.3,
  includeScore: true,
}
/**
 * Hook that provides unified search functionality for feeds and entries
 * Used by both context bar and mention plugin
 */
export const useFeedEntrySearchService = (options: SearchServiceOptions = {}) => {
  const { maxRecentEntries = 50, fuseOptions = defaultFuseOptions } = options

  // Get data sources
  const allSubscriptions = useAllFeedSubscription()
  const view = useRouteParamsSelector((route) => route.view)
  const recentEntryIds = useEntryIdsByView(view, false)
  const entryStore = useEntryStore((state) => state.data)

  // Prepare feed items
  const feedItems = useMemo(() => {
    return allSubscriptions
      .filter((subscription) => subscription.feedId)
      .map((subscription) => {
        const customTitle = subscription.title
        if (!subscription.feedId) return null

        const feed = getFeedById(subscription.feedId!)
        return {
          id: subscription.feedId!,
          title: customTitle || feed?.title || `Feed ${subscription.feedId}`,
          type: "feed" as const,
        }
      })
      .filter(Boolean) as SearchItem[]
  }, [allSubscriptions])

  // Prepare entry items (recent entries, limited for performance)
  const entryItems = useMemo(() => {
    if (!recentEntryIds) return []

    return recentEntryIds
      .slice(0, maxRecentEntries)
      .map((entryId) => {
        const entry = entryStore[entryId]
        return entry
          ? {
              id: entryId,
              title: entry.title || "Untitled",
              type: "entry" as const,
            }
          : null
      })
      .filter(Boolean) as SearchItem[]
  }, [recentEntryIds, entryStore, maxRecentEntries])

  // Combine all search items
  const allItems = useMemo(() => {
    return [...feedItems, ...entryItems]
  }, [feedItems, entryItems])

  // Create Fuse instance for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(allItems, fuseOptions)
  }, [allItems, JSON.stringify(fuseOptions)])

  // Search function
  const search = useMemo(() => {
    return (query: string, type?: "feed" | "entry", maxResults = 10): SearchItem[] => {
      if (!query.trim()) {
        // If no query, return recent items of the specified type
        const filteredItems = allItems.filter((item) => !type || item.type === type)
        return filteredItems.slice(0, maxResults)
      }

      // Perform fuzzy search
      const fuseResults = fuse.search(query)
      return fuseResults
        .map((result) => result.item)
        .filter((item) => !type || item.type === type)
        .slice(0, maxResults)
    }
  }, [allItems, fuse])

  return {
    search,
    feedItems,
    entryItems,
    allItems,
  }
}
