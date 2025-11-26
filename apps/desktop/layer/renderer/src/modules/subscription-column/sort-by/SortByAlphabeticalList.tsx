import { isOnboardingFeedUrl } from "@follow/store/constants/onboarding"
import { useFeedStore } from "@follow/store/feed/store"
import { useSubscriptionStore } from "@follow/store/subscription/store"
import { getInboxHandleOrFeedIdFromFeedId } from "@follow/store/unread/utils"
import { sortByAlphabet } from "@follow/utils/utils"
import { Fragment, useCallback } from "react"

import { getPreferredTitle } from "~/store/feed/hooks"

import { useFeedListSortSelector } from "../atom"
import { FeedCategoryAutoHideUnread } from "../FeedCategory"
import { InboxItem, ListItemAutoHideUnread } from "../FeedItem"
import type { FeedListProps, ListListProps } from "./types"

export const SortByAlphabeticalFeedList = ({
  view,
  data,
  categoryOpenStateData,
}: FeedListProps) => {
  const feedId2CategoryMap = useSubscriptionStore(
    useCallback(
      (state) => {
        const map = {} as Record<string, string>
        for (const categoryName in data) {
          const feedId = data[categoryName]![0]
          if (!feedId) {
            continue
          }
          const subscription = state.data[feedId]
          if (!subscription) {
            continue
          }
          if (subscription.category) {
            map[feedId] = subscription.category
          }
        }
        return map
      },
      [data],
    ),
  )
  const categoryName2RealDisplayNameMap = useFeedStore(
    useCallback(
      (state) => {
        const map = {} as Record<string, string>
        for (const categoryName in data) {
          const feedId = data[categoryName]![0]

          if (!feedId) {
            continue
          }
          const feed = state.feeds[feedId]
          if (!feed) {
            continue
          }
          const hascategoryNameNotDefault = !!feedId2CategoryMap[feedId]
          const isSingle = data[categoryName]!.length === 1
          if (!isSingle || hascategoryNameNotDefault) {
            map[categoryName] = categoryName
          } else {
            map[categoryName] = getPreferredTitle(feed)!
          }
        }
        return map
      },
      [data, feedId2CategoryMap],
    ),
  )

  const isDesc = useFeedListSortSelector((s) => s.order === "desc")

  // Separate categories with onboarding feeds and regular categories
  const sortedByAlphabetical = useFeedStore(
    useCallback(
      (state) => {
        const onboardingCategories: string[] = []
        const regularCategories: string[] = []

        // First, separate categories
        for (const category of Object.keys(data)) {
          const ids = data[category]!
          const hasOnboardingFeed = ids.some((id) => {
            const feed = state.feeds[id]
            return feed && isOnboardingFeedUrl(feed.url)
          })

          if (hasOnboardingFeed) {
            onboardingCategories.push(category)
          } else {
            regularCategories.push(category)
          }
        }

        // Sort each group alphabetically
        const sortCategories = (categories: string[]) => {
          const sorted = categories.sort((a, b) => {
            const nameA = categoryName2RealDisplayNameMap[a]
            const nameB = categoryName2RealDisplayNameMap[b]
            if (typeof nameA !== "string" || typeof nameB !== "string") {
              return 0
            }
            return sortByAlphabet(nameA, nameB)
          })
          return isDesc ? sorted : sorted.reverse()
        }

        // Return onboarding categories first, then regular categories
        return [...sortCategories(onboardingCategories), ...sortCategories(regularCategories)]
      },
      [data, categoryName2RealDisplayNameMap, isDesc],
    ),
  )

  return (
    <Fragment>
      {sortedByAlphabetical.map((category) => (
        <FeedCategoryAutoHideUnread
          key={category}
          data={data[category]!}
          view={view}
          categoryOpenStateData={categoryOpenStateData}
        />
      ))}
    </Fragment>
  )
}

export const SortByAlphabeticalListList = ({ view, data }: ListListProps) => {
  return (
    <div>
      {data.map((listId) => (
        <ListItemAutoHideUnread key={listId} listId={listId} view={view} />
      ))}
    </div>
  )
}

export const SortByAlphabeticalInboxList = ({ view, data }: ListListProps) => {
  return (
    <div>
      {data.map((feedId) => (
        <InboxItem key={feedId} inboxId={getInboxHandleOrFeedIdFromFeedId(feedId)} view={view} />
      ))}
    </div>
  )
}
