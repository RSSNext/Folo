import { getEntry } from "@follow/store/entry/getter"
import { useEntryIdsByView } from "@follow/store/entry/hooks"
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
  const { fuseOptions = defaultFuseOptions } = options

  // Get data sources
  const view = useRouteParamsSelector((route) => route.view)
  const allSubscriptions = useAllFeedSubscription()
  const categories = useCategories()
  const recentEntryIds = useEntryIdsByView(view, false)

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
      .map((entryId) => {
        const entry = getEntry(entryId)
        return entry
          ? {
              id: entryId,
              title: entry.title || "Untitled",
              type: "entry" as const,
            }
          : null
      })
      .filter(Boolean) as SearchItem[]
  }, [recentEntryIds])

  // Combine all search items
  const allItems = useMemo(() => {
    return [...categoryItems, ...feedItems, ...entryItems]
  }, [categoryItems, feedItems, entryItems])

  // Create Fuse instance for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(allItems, fuseOptions)
  }, [allItems, JSON.stringify(fuseOptions)])

  // Calculate type ratios for proportional result distribution
  const typeRatios = useMemo(() => {
    const totalItems = allItems.length
    if (totalItems === 0) {
      return { category: 0, feed: 0, entry: 0 }
    }

    const categoryCounts = allItems.reduce(
      (acc, item) => {
        acc[item.type] += 1
        return acc
      },
      { category: 0, feed: 0, entry: 0 },
    )

    return {
      category: categoryCounts.category / totalItems,
      feed: categoryCounts.feed / totalItems,
      entry: categoryCounts.entry / totalItems,
    }
  }, [allItems])

  // Search function
  const search = useMemo(() => {
    const applyProportionalLimit = (items: SearchItem[], maxResults: number) => {
      // Calculate max items per type based on ratios
      const maxPerType = {
        category: Math.max(1, Math.floor(maxResults * typeRatios.category)),
        feed: Math.max(1, Math.floor(maxResults * typeRatios.feed)),
        entry: Math.max(1, Math.floor(maxResults * typeRatios.entry)),
      }

      const counts = { category: 0, feed: 0, entry: 0 }
      const result: SearchItem[] = []

      for (const item of items) {
        if (result.length >= maxResults) break

        if (counts[item.type] < maxPerType[item.type]) {
          result.push(item)
          counts[item.type] += 1
        }
      }

      return result
    }

    return (query: string, type?: "feed" | "entry" | "category", maxResults = 10): SearchItem[] => {
      const matchesType = (item: SearchItem) => {
        if (!type) return true
        if (type === "feed") return item.type === "feed" || item.type === "category"
        return item.type === type
      }

      if (!query.trim()) {
        // If no query, return recent items of the specified type
        const filteredItems = allItems.filter(matchesType)
        return applyProportionalLimit(filteredItems, maxResults)
      }

      // Perform fuzzy search
      const fuseResults = fuse.search(query)
      const filteredResults = fuseResults.map((result) => result.item).filter(matchesType)

      return applyProportionalLimit(filteredResults, maxResults)
    }
  }, [allItems, fuse, typeRatios])

  return {
    search,
    feedItems,
    entryItems,
    categoryItems,
    allItems,
  }
}
