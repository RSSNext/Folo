import { isOnboardingFeedUrl } from "@follow/store/constants/onboarding"
import { useFeedStore } from "@follow/store/feed/store"
import { useSortedCategoriesByUnread } from "@follow/store/unread/hooks"
import { Fragment, memo, useCallback } from "react"

import { useFeedListSortSelector } from "../atom"
import { FeedCategoryAutoHideUnread } from "../FeedCategory"
import type { FeedListProps } from "./types"

export const SortByUnreadFeedList = memo(({ view, data, categoryOpenStateData }: FeedListProps) => {
  const isDesc = useFeedListSortSelector((s) => s.order === "desc")
  const sortedByUnread = useSortedCategoriesByUnread(data, isDesc)

  // Separate categories with onboarding feeds and regular categories
  const sortedList = useFeedStore(
    useCallback(
      (state) => {
        if (!sortedByUnread) return []
        const onboardingCategories: [string, string[]][] = []
        const regularCategories: [string, string[]][] = []

        // The tuples are passed through as they are, so an unchanged order keeps the result equal
        for (const entry of sortedByUnread) {
          const hasOnboardingFeed = entry[1].some((id) => {
            const feed = state.feeds[id]
            return feed && isOnboardingFeedUrl(feed.url)
          })

          if (hasOnboardingFeed) {
            onboardingCategories.push(entry)
          } else {
            regularCategories.push(entry)
          }
        }

        return [...onboardingCategories, ...regularCategories]
      },
      [sortedByUnread],
    ),
  )

  return (
    <Fragment>
      {sortedList.map(([category, ids]) => (
        <FeedCategoryAutoHideUnread
          key={category}
          data={ids}
          view={view}
          categoryOpenStateData={categoryOpenStateData}
        />
      ))}
    </Fragment>
  )
})
