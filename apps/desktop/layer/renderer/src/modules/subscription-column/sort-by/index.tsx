import { useFeedListSortSelector } from "../atom"
import {
  SortByAlphabeticalFeedList,
  SortByAlphabeticalInboxList,
  SortByAlphabeticalListList,
} from "./SortByAlphabeticalList"
import { SortByUnreadFeedList } from "./SortByUnreadList"
import type { FeedListProps, ListListProps } from "./types"

export const SortableFeedList = (props: FeedListProps) => {
  const by = useFeedListSortSelector((s) => s.by)

  switch (by) {
    case "count": {
      return <SortByUnreadFeedList {...props} />
    }
    case "alphabetical": {
      return <SortByAlphabeticalFeedList {...props} />
    }
  }
}

export const SortByAlphabeticalList = (props: ListListProps) => {
  const by = useFeedListSortSelector((s) => s.by)

  switch (by) {
    default: {
      return <SortByAlphabeticalListList {...props} />
    }
  }
}

export const SortByAlphabeticalInbox = (props: ListListProps) => {
  const by = useFeedListSortSelector((s) => s.by)

  switch (by) {
    default: {
      return <SortByAlphabeticalInboxList {...props} />
    }
  }
}
