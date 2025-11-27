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

        for (const [category, ids] of sortedByUnread) {
          const hasOnboardingFeed = ids.some((id) => {
            const feed = state.feeds[id]
            return feed && isOnboardingFeedUrl(feed.url)
          })

          if (hasOnboardingFeed) {
            onboardingCategories.push([category, ids.concat()])
          } else {
            regularCategories.push([category, ids.concat()])
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
