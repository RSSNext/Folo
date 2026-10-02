import { getFeedById } from "@follow/store/feed/getter"
import { useFeedById } from "@follow/store/feed/hooks"
import type { FeedModel } from "@follow/store/feed/types"
import { getSubscriptionByFeedId } from "@follow/store/subscription/getter"
import { useSubscriptionByFeedId } from "@follow/store/subscription/hooks"
import { getSocialAuthorTitle } from "@follow/utils/social-author-title"

const selectFeedTitle = (feed: FeedModel) => feed.title

/**
 * Resolve the title shown for a feed. The custom title the user set on the subscription takes
 * precedence over the feed's own title.
 */
export const getPreferredFeedTitle = (feedId: string | null | undefined) => {
  if (!feedId) return
  return getSubscriptionByFeedId(feedId)?.title || getFeedById(feedId)?.title || undefined
}

/**
 * Reactive version of {@link getPreferredFeedTitle}.
 */
export const usePreferredFeedTitle = (feedId: string | null | undefined) => {
  const subscriptionTitle = useSubscriptionByFeedId(feedId)?.title
  const feedTitle = useFeedById(feedId, selectFeedTitle)
  return subscriptionTitle || feedTitle || undefined
}

/**
 * Title for a social media post: the author, or the subscription's custom title when the post comes
 * from the account the feed follows. Same rule as the desktop app.
 */
export const useSocialAuthorTitle = (
  feedId: string | null | undefined,
  author: string | null | undefined,
) => {
  const subscriptionTitle = useSubscriptionByFeedId(feedId)?.title
  const feedTitle = useFeedById(feedId, selectFeedTitle)
  return getSocialAuthorTitle({ author, feedTitle, subscriptionTitle })
}
