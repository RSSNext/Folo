import { FeedViewType } from "@follow/constants"

import { FEED_COLLECTION_LIST, ROUTE_FEED_PENDING } from "../../constants/app"
import { getListFeedIds } from "../list/getters"
import { getSubscribedFeedIdAndInboxHandlesByView } from "../subscription/getter"
import { unreadCountAllSelector, unreadCountIdSelector, unreadCountIdsSelector } from "./selectors"
import { useUnreadStore } from "./store"
import type { FeedIdOrInboxHandle, UnreadListScope } from "./types"

export const getUnreadById = (id: FeedIdOrInboxHandle) => {
  const state = useUnreadStore.getState()
  return unreadCountIdSelector(id)(state)
}

export const getUnreadByListId = (listId: string) => {
  const state = useUnreadStore.getState()
  const feedIds = getListFeedIds(listId)
  if (!feedIds) return 0
  return unreadCountIdsSelector(feedIds)(state)
}

export const getUnreadAll = () => {
  const state = useUnreadStore.getState()
  return unreadCountAllSelector(state)
}

const TIMELINE_VIEWS = [
  FeedViewType.Articles,
  FeedViewType.SocialMedia,
  FeedViewType.Pictures,
  FeedViewType.Videos,
  FeedViewType.Audios,
  FeedViewType.Notifications,
]

/**
 * The feed ids and inbox handles whose unread entries an entry list shows, so the list can be
 * compared with the counters. Undefined for lists without a counter, such as collections.
 */
export const getUnreadScopeIds = (scope: UnreadListScope): string[] | undefined => {
  if (scope.isCollection || scope.feedId === FEED_COLLECTION_LIST) return
  if (scope.inboxId) return [scope.inboxId]
  if (scope.listId) return getListFeedIds(scope.listId) ?? []
  if (scope.feedIdList) return scope.feedIdList
  if (scope.feedId && scope.feedId !== ROUTE_FEED_PENDING) {
    return scope.feedId.split(",").filter((id) => id.length > 0)
  }
  if (typeof scope.view !== "number") return

  const views = scope.view === FeedViewType.All ? TIMELINE_VIEWS : [scope.view]
  return Array.from(
    new Set(
      views.flatMap((view) =>
        getSubscribedFeedIdAndInboxHandlesByView({
          view,
          excludePrivate: scope.excludePrivate === true,
          // Hidden subscriptions are left out of the timeline by the server as well.
          excludeHidden: true,
        }),
      ),
    ),
  )
}

/** The unread counter an entry list is expected to agree with. */
export const getUnreadCountForScope = (scope: UnreadListScope) => {
  const ids = getUnreadScopeIds(scope)
  if (!ids) return
  return unreadCountIdsSelector(ids)(useUnreadStore.getState())
}
