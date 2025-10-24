import { getView } from "@follow/constants"
import type { EntryModel } from "@follow/store/entry/types"
import { useFeedById, usePrefetchFeed } from "@follow/store/feed/hooks"
import { feedIconSelector } from "@follow/store/feed/selectors"
import { useListById, usePrefetchListById } from "@follow/store/list/hooks"
import { getSubscriptionByFeedId } from "@follow/store/subscription/getter"
import { useTranslation } from "react-i18next"
import { useShallow } from "zustand/shallow"

import {
  FEED_COLLECTION_LIST,
  ROUTE_FEED_IN_FOLDER,
  ROUTE_FEED_IN_INBOX,
  ROUTE_FEED_PENDING,
} from "~/constants"
import { useRouteParams } from "~/hooks/biz/useRouteParams"

export type PreferredTitleTarget = {
  type: string
  id: string
  title?: Nullable<string>
  [key: string]: any
}
export const getPreferredTitle = (
  target?: PreferredTitleTarget,
  entry?: Pick<EntryModel, "authorUrl"> | null,
) => {
  if (!target?.id) {
    return target?.title
  }

  if (target.type === "inbox") {
    if (entry?.authorUrl) return entry.authorUrl.replace(/^mailto:/, "")
    return target.title || `${target.id.slice(0, 1).toUpperCase()}${target.id.slice(1)}'s Inbox`
  }

  const subscription = getSubscriptionByFeedId(target.id)
  return subscription?.title || target.title
}

export const useFeedHeaderTitle = () => {
  const { t } = useTranslation()
  const { feedId: currentFeedId, view, listId: currentListId } = useRouteParams()

  const feedTitle = useFeedById(currentFeedId, getPreferredTitle)
  const listTitle = useListById(currentListId, getPreferredTitle)

  usePrefetchFeed(currentFeedId, { enabled: !feedTitle })
  usePrefetchListById(currentListId, { enabled: !listTitle })

  switch (currentFeedId) {
    case ROUTE_FEED_PENDING: {
      return t(getView(view).name, {
        ns: "common",
      })
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

export const useFeedHeaderIcon = () => {
  const { feedId: currentFeedId, listId: currentListId } = useRouteParams()

  const feedIcon = useFeedById(currentFeedId, useShallow(feedIconSelector))
  const listIcon = useListById(
    currentListId,
    useShallow((feed) => ({
      type: feed.type,
      ownerUserId: feed.ownerUserId,
      id: feed.id,
      title: feed.title,
      url: (feed as any).url || "",
      image: feed.image,
    })),
  )

  return feedIcon || listIcon
}
