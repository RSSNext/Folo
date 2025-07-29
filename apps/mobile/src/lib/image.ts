import { getUrlIcon } from "@follow/utils/utils"

import type { FeedIconFeed } from "../components/ui/icon/feed-icon"

/**
 * get feed icon source
 */
export const getFeedIconSource = (
  feed?: FeedIconFeed,
  siteUrl?: string,
  fallback = false,
): string | undefined => {
  switch (true) {
    case !feed && !!siteUrl: {
      const [src] = getFeedIconSrc(siteUrl, fallback)
      return src
    }
    case !!feed && !!feed.image: {
      return feed.image
    }
    case !!feed && !feed.image && !!feed.siteUrl: {
      const [src] = getFeedIconSrc(feed.siteUrl, fallback)
      return src
    }
    default: {
      return undefined
    }
  }
}
const getFeedIconSrc = (siteUrl: string, fallback: boolean) => {
  const ret = getUrlIcon(siteUrl, fallback)

  return [ret.src, ret.fallbackUrl]
}
