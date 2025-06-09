import { views } from "@follow/constants"
import type { FeedOrListRespModel } from "@follow/models/types"
import type { EntryModel } from "@follow/store/entry/types"
import { useFeedById } from "@follow/store/feed/hooks"
import { useListById } from "@follow/store/list/hooks"
import { getSubscriptionByFeedId } from "@follow/store/subscription/getter"
import { useTranslation } from "react-i18next"

import {
  FEED_COLLECTION_LIST,
  ROUTE_FEED_IN_FOLDER,
  ROUTE_FEED_IN_INBOX,
  ROUTE_FEED_PENDING,
} from "~/constants"
import { useRouteParams } from "~/hooks/biz/useRouteParams"

export const getPreferredTitle = (
  feed?: Pick<FeedOrListRespModel, "type" | "id" | "title"> | null,
  entry?: Pick<EntryModel, "authorUrl"> | null,
) => {
  if (!feed?.id) {
    return feed?.title
  }

  if (feed.type === "inbox") {
    if (entry?.authorUrl) return entry.authorUrl.replace(/^mailto:/, "")
    return feed.title || `${feed.id.slice(0, 1).toUpperCase()}${feed.id.slice(1)}'s Inbox`
  }

  const subscription = getSubscriptionByFeedId(feed.id)
  return subscription?.title || feed.title
}

export const useFeedHeaderTitle = () => {
  const { t } = useTranslation()
  const { feedId: currentFeedId, view, listId: currentListId } = useRouteParams()

  const feedTitle = useFeedById(currentFeedId, getPreferredTitle)

  const listTitle = useListById(currentListId, getPreferredTitle)

  switch (currentFeedId) {
    case ROUTE_FEED_PENDING: {
      return t(views[view]!.name, { ns: "common" })
    }
    case FEED_COLLECTION_LIST: {
      return t("words.starred")
    }
    default: {
      if (currentFeedId?.startsWith(ROUTE_FEED_IN_FOLDER)) {
        return currentFeedId.replace(ROUTE_FEED_IN_FOLDER, "")
      }
      if (currentFeedId?.startsWith(ROUTE_FEED_IN_INBOX)) {
        return currentFeedId.replace(ROUTE_FEED_IN_INBOX, "")
      }
      return feedTitle || listTitle
    }
  }
}
