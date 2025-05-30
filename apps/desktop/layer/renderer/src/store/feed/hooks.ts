import { views } from "@follow/constants"
import type { FeedModel, FeedOrListRespModel, InboxModel, ListModel } from "@follow/models/types"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import {
  FEED_COLLECTION_LIST,
  ROUTE_FEED_IN_FOLDER,
  ROUTE_FEED_IN_INBOX,
  ROUTE_FEED_PENDING,
} from "~/constants"
import { useRouteParams } from "~/hooks/biz/useRouteParams"

import { useInboxStore } from "../inbox"
import { useListStore } from "../list"
import {
  feedByIdOrUrlSelector,
  feedByIdSelector,
  feedByIdSelectorWithTransform,
  feedByIdWithTransformSelector,
  inboxByIdSelectorWithTransform,
  listByIdSelectorWithTransform,
} from "./selector"
import { getPreferredTitle, useFeedStore } from "./store"
import type { FeedQueryParams } from "./types"

export function useFeedById(feedId: Nullable<string>): FeedModel | null
export function useFeedById<T>(feedId: Nullable<string>, selector: (feed: FeedModel) => T): T | null
export function useFeedById<T>(feedId: Nullable<string>, transform?: (feed: FeedModel) => T) {
  return useFeedStore(
    useCallback(
      (state) =>
        transform
          ? feedByIdWithTransformSelector(feedId, transform)(state)
          : feedByIdSelector(feedId)(state),
      [feedId, transform],
    ),
  )
}

export const useFeedByIdOrUrl = (feed: FeedQueryParams) =>
  useFeedStore(useCallback((state) => feedByIdOrUrlSelector(feed)(state), [feed]))

export const useFeedByIdSelector = <T>(
  feedId: Nullable<string>,
  selector: (feed: FeedOrListRespModel) => T,
) =>
  useFeedStore(
    useCallback(
      (state) => feedByIdSelectorWithTransform(feedId, selector)(state),
      [feedId, selector],
    ),
  )

export const useListByIdSelector = <T>(
  listId: Nullable<string>,
  selector: (list: ListModel) => T,
) =>
  useListStore(
    useCallback(
      (state) => listByIdSelectorWithTransform(listId, selector)(state),
      [listId, selector],
    ),
  )

export const useInboxByIdSelector = <T>(
  inboxId: Nullable<string>,
  selector: (inbox: InboxModel) => T,
) =>
  useInboxStore(
    useCallback(
      (state) => inboxByIdSelectorWithTransform(inboxId, selector)(state),
      [inboxId, selector],
    ),
  )

export const useFeedHeaderTitle = () => {
  const { t } = useTranslation()
  const { feedId: currentFeedId, view, listId: currentListId } = useRouteParams()

  const feedTitle = useFeedByIdSelector(currentFeedId, getPreferredTitle)
  const listTitle = useListByIdSelector(currentListId, getPreferredTitle)

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
