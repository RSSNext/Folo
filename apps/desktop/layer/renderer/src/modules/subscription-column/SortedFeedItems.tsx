import type { FeedViewType } from "@follow/constants"
import { isOnboardingFeedUrl } from "@follow/store/constants/onboarding"
import { useFeedStore } from "@follow/store/feed/store"
import { useSortedIdsByUnread } from "@follow/store/unread/hooks"
import { sortByAlphabet } from "@follow/utils/utils"
import { Fragment, memo, useCallback } from "react"

import { getPreferredTitle } from "~/store/feed/hooks"

import { useFeedListSortSelector } from "./atom"
import { FeedItemAutoHideUnread } from "./FeedItem"

type SortListProps = {
  ids: string[]
  view: FeedViewType
  showCollapse: boolean
}

export const SortedFeedItems = memo((props: SortListProps) => {
  const by = useFeedListSortSelector((s) => s.by)
  switch (by) {
    case "count": {
      return <SortByUnreadList {...props} />
    }
    case "alphabetical": {
      return <SortByAlphabeticalList {...props} />
    }

    default: {
      return <SortByUnreadList {...props} />
    }
  }
})

const SortByAlphabeticalList = (props: SortListProps) => {
  const { ids, showCollapse, view } = props
  const isDesc = useFeedListSortSelector((s) => s.order === "desc")
  const sortedFeedList = useFeedStore(
    useCallback(
      (state) => {
        // Separate onboarding feeds and regular feeds
        const onboardingFeeds: string[] = []
        const regularFeeds: string[] = []

        for (const id of ids) {
          const feed = state.feeds[id]
          if (feed && isOnboardingFeedUrl(feed.url)) {
            onboardingFeeds.push(id)
          } else {
            regularFeeds.push(id)
          }
        }

        // Sort each group
        const sortFeeds = (feedIds: string[]) => {
          const sorted = feedIds.sort((a, b) => {
            const feedTitleA = getPreferredTitle(state.feeds[a]) || ""
            const feedTitleB = getPreferredTitle(state.feeds[b]) || ""
            return sortByAlphabet(feedTitleA, feedTitleB)
          })
          return isDesc ? sorted : sorted.reverse()
        }

        // Return onboarding feeds first, then regular feeds
        return [...sortFeeds(onboardingFeeds), ...sortFeeds(regularFeeds)]
      },
      [ids, isDesc],
    ),
  )
  return (
    <Fragment>
      {sortedFeedList.map((feedId) => (
        <FeedItemAutoHideUnread
          key={feedId}
          feedId={feedId}
          view={view}
          className={showCollapse ? "pl-6" : "pl-2.5"}
        />
      ))}
    </Fragment>
  )
}

const SortByUnreadList = ({ ids, showCollapse, view }: SortListProps) => {
  const isDesc = useFeedListSortSelector((s) => s.order === "desc")
  const sortByUnreadFeedList = useSortedIdsByUnread(ids, isDesc)

  // Separate onboarding feeds and regular feeds, then merge with onboarding first
  const sortedList = useFeedStore(
    useCallback(
      (state) => {
        const onboardingFeeds: string[] = []
        const regularFeeds: string[] = []

        for (const id of sortByUnreadFeedList) {
          const feed = state.feeds[id]
          if (feed && isOnboardingFeedUrl(feed.url)) {
            onboardingFeeds.push(id)
          } else {
            regularFeeds.push(id)
          }
        }

        return [...onboardingFeeds, ...regularFeeds]
      },
      [sortByUnreadFeedList],
    ),
  )

  return (
    <Fragment>
      {sortedList.map((feedId) => (
        <FeedItemAutoHideUnread
          key={feedId}
          feedId={feedId}
          view={view}
          className={showCollapse ? "pl-6" : "pl-2.5"}
        />
      ))}
    </Fragment>
  )
}
