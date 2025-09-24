import { useEntryIdsByView } from "@follow/store/entry/hooks"
import { useEntryStore } from "@follow/store/entry/store"
import { getFeedById } from "@follow/store/feed/getter"
import { useAllFeedSubscription, useCategories } from "@follow/store/subscription/hooks"
import type { IFuseOptions } from "fuse.js"
import Fuse from "fuse.js"
import { useMemo } from "react"

import { ROUTE_FEED_IN_FOLDER } from "~/constants"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"

/**
 * Generic search item interface
 */
export interface SearchItem {
  id: string
  title: string
  type: "feed" | "entry" | "category"
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

const MAX_CATEGORY_RESULTS = 3
/**
 * Hook that provides unified search functionality for feeds and entries
 * Used by both context bar and mention plugin
 */
export const useFeedEntrySearchService = (options: SearchServiceOptions = {}) => {
  const { maxRecentEntries = 50, fuseOptions = defaultFuseOptions } = options

  // Get data sources
  const view = useRouteParamsSelector((route) => route.view)
  const allSubscriptions = useAllFeedSubscription()
  const categories = useCategories()
  const recentEntryIds = useEntryIdsByView(view, false)
  const entryStore = useEntryStore((state) => state.data)

  const categoryItems = useMemo(() => {
    if (!categories?.length) return []

    return categories
      .filter((category) => !!category && category.trim().length > 0)
      .map((category) => ({
        id: `${ROUTE_FEED_IN_FOLDER}${category}`,
        title: category,
        type: "category" as const,
      }))
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [categories])

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
    return [...categoryItems, ...feedItems, ...entryItems]
  }, [categoryItems, feedItems, entryItems])

  // Create Fuse instance for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(allItems, fuseOptions)
  }, [allItems, JSON.stringify(fuseOptions)])

  // Search function
  const search = useMemo(() => {
    const applyCategoryLimit = (items: SearchItem[]) => {
      let categoryCount = 0
      return items.filter((item) => {
        if (item.type !== "category") return true
        if (categoryCount >= MAX_CATEGORY_RESULTS) {
          return false
        }
        categoryCount += 1
        return true
      })
    }

    return (query: string, type?: "feed" | "entry" | "category", maxResults = 10): SearchItem[] => {
      const matchesType = (item: SearchItem) => {
        if (!type) return true
        if (type === "feed") return item.type === "feed" || item.type === "category"
        return item.type === type
      }

      if (!query.trim()) {
        // If no query, return recent items of the specified type
        const filteredItems = applyCategoryLimit(allItems.filter(matchesType))
        return filteredItems.slice(0, maxResults)
      }

      // Perform fuzzy search
      const fuseResults = fuse.search(query)
      const filteredResults = fuseResults.map((result) => result.item).filter(matchesType)

      return applyCategoryLimit(filteredResults).slice(0, maxResults)
    }
  }, [allItems, fuse])

  return {
    search,
    feedItems,
    entryItems,
    categoryItems,
    allItems,
  }
}
