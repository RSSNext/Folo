import { Fragment, useCallback } from "react"

import { useFeedUnreadStore } from "~/store/unread"

import { useFeedListSortSelector } from "../atom"
import { FeedCategory } from "../FeedCategory"
import type { FeedListProps } from "./types"

export const SortByUnreadFeedList = ({ view, data, categoryOpenStateData }: FeedListProps) => {
  const isDesc = useFeedListSortSelector((s) => s.order === "desc")

  const sortedByUnread = useFeedUnreadStore(
    useCallback(
      (state) => {
        const sortedList = [] as [string, string[]][]
        const folderUnread = {} as Record<string, number>
        // Calc total unread count for each folder
        for (const category in data) {
          folderUnread[category] = data[category]!.reduce(
            (acc, cur) => (state.data[cur] || 0) + acc,
            0,
          )
        }

        // Sort by unread count
        Object.keys(folderUnread)
          .sort((a, b) => folderUnread[b]! - folderUnread[a]!)
          .forEach((key) => {
            sortedList.push([key, data[key]!])
          })

        if (!isDesc) {
          sortedList.reverse()
        }
        return sortedList
      },
      [data, isDesc],
    ),
  )

  return (
    <Fragment>
      {sortedByUnread?.map(([category, ids]) => (
        <FeedCategory
          key={category}
          data={ids}
          view={view}
          categoryOpenStateData={categoryOpenStateData}
        />
      ))}
    </Fragment>
  )
}
