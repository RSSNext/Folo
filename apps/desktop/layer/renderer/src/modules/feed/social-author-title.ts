import { useSubscriptionByFeedId } from "@follow/store/subscription/hooks"
import { getSocialAuthorTitle } from "@follow/utils/social-author-title"

export const useSocialAuthorTitle = ({
  feedId,
  author,
  feedTitle,
}: {
  feedId?: string | null
  author?: string | null
  feedTitle?: string | null
}) => {
  const subscriptionTitle = useSubscriptionByFeedId(feedId)?.title
  return getSocialAuthorTitle({ author, feedTitle, subscriptionTitle })
}
