import { Fragment } from "react"

import { useSortedCategoriesByUnread } from "~/store/unread/hooks"

import { useFeedListSortSelector } from "../atom"
import { FeedCategoryAutoHideUnread } from "../FeedCategory"
import type { FeedListProps } from "./types"

export const SortByUnreadFeedList = ({ view, data, categoryOpenStateData }: FeedListProps) => {
  const isDesc = useFeedListSortSelector((s) => s.order === "desc")
  const sortedByUnread = useSortedCategoriesByUnread(data, isDesc)

  return (
    <Fragment>
      {sortedByUnread?.map(([category, ids]) => (
        <FeedCategoryAutoHideUnread
          key={category}
          data={ids}
          view={view}
          categoryOpenStateData={categoryOpenStateData}
        />
      ))}
    </Fragment>
  )
}
