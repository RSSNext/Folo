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

  let sortedByAlphabetical = Object.keys(data).sort((a, b) => {
    const nameA = categoryName2RealDisplayNameMap[a]
    const nameB = categoryName2RealDisplayNameMap[b]
    if (typeof nameA !== "string" || typeof nameB !== "string") {
      return 0
    }
    return sortByAlphabet(nameA, nameB)
  })
  if (!isDesc) {
    sortedByAlphabetical = sortedByAlphabetical.reverse()
  }

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
