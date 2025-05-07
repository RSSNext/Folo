import { sortByAlphabet } from "@follow/utils/utils"
import { Fragment, useCallback } from "react"

import { INBOX_PREFIX_ID } from "~/constants"
import { getPreferredTitle, useFeedStore } from "~/store/feed"
import { useSubscriptionStore } from "~/store/subscription"

import { useFeedListSortSelector } from "../atom"
import { FeedCategory } from "../FeedCategory"
import { InboxItem, ListItem } from "../FeedItem"
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
        <FeedCategory
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
      {Object.keys(data).map((listId) => (
        <ListItem key={listId} listId={listId} view={view} />
      ))}
    </div>
  )
}

export const SortByAlphabeticalInboxList = ({ view, data }: ListListProps) => {
  return (
    <div>
      {Object.keys(data).map((feedId) => (
        <InboxItem
          key={feedId}
          inboxId={
            feedId.startsWith(INBOX_PREFIX_ID) ? feedId.slice(INBOX_PREFIX_ID.length) : feedId
          }
          view={view}
        />
      ))}
    </div>
  )
}
