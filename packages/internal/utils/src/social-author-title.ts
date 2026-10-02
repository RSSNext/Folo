interface SocialAuthorTitleInput {
  author?: string | null
  feedTitle?: string | null
  /** The custom title the user gave the subscription, if any */
  subscriptionTitle?: string | null
}

/**
 * Social media posts are labelled with their author instead of the feed title. When the post comes
 * from the account the feed follows (the author is missing, e.g. Telegram channels, or is part of
 * the feed title, e.g. `XXX的微博` for Weibo user `XXX`), show the custom title the user gave the
 * subscription, as the subscription list does. Posts by other authors, such as reposts, keep the
 * author name.
 */
export const getSocialAuthorTitle = ({
  author,
  feedTitle,
  subscriptionTitle,
}: SocialAuthorTitleInput) => {
  const authorName = author?.trim()
  const hasCustomTitle = !!subscriptionTitle && subscriptionTitle !== feedTitle

  if (hasCustomTitle && (!authorName || feedTitle?.includes(authorName))) {
    return subscriptionTitle
  }

  return authorName || feedTitle || undefined
}
