import type { FeedViewType } from "@follow/constants"
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
        const res = ids.sort((a, b) => {
          const feedTitleA = getPreferredTitle(state.feeds[a]) || ""
          const feedTitleB = getPreferredTitle(state.feeds[b]) || ""
          return sortByAlphabet(feedTitleA, feedTitleB)
        })

        if (isDesc) {
          return res
        }
        return res.reverse()
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

  return (
    <Fragment>
      {sortByUnreadFeedList.map((feedId) => (
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
