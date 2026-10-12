import { isTwitterUrl, isXUrl } from "@follow/utils/link-parser"

// First path segments of x.com that are app routes, not user handles
const X_RESERVED_PATHS = new Set([
  "explore",
  "hashtag",
  "home",
  "i",
  "intent",
  "messages",
  "notifications",
  "search",
  "settings",
  "share",
])
const X_HANDLE_REGEX = /^\w{1,15}$/

export const parseSocialMedia = (parsedUrl?: string | null) => {
  if (!parsedUrl) return

  const isX = isXUrl(parsedUrl).validate || isTwitterUrl(parsedUrl).validate
  if (!isX) return

  // Both x.com/<handle> and x.com/<handle>/status/<id> start with the handle
  const handle = new URL(parsedUrl).pathname.split("/").find(Boolean)
  if (!handle || X_RESERVED_PATHS.has(handle.toLowerCase()) || !X_HANDLE_REGEX.test(handle)) {
    return
  }

  return {
    type: "x",
    meta: {
      handle,
    },
  }
}

interface SocialFeedLike {
  url?: string | null
  siteUrl?: string | null
}

/** A feed of X posts, going by the RSSHub route it reads or the site it links to */
export const isXFeed = (feed?: SocialFeedLike | null) => {
  if (!feed) return false
  if (feed.url && /^rsshub:\/\/twitter\//i.test(feed.url)) return true
  return !!feed.siteUrl && (isXUrl(feed.siteUrl).validate || isTwitterUrl(feed.siteUrl).validate)
}

/**
 * The X author of an entry of an X feed. An entry of another feed that only links to a post, such
 * as a Hacker News item, was not written by the author of that post and gets none.
 */
export const parseEntrySocialMedia = (
  entry: { authorUrl?: string | null; url?: string | null; guid?: string | null },
  feed?: SocialFeedLike | null,
) => (isXFeed(feed) ? parseSocialMedia(entry.authorUrl || entry.url || entry.guid) : undefined)
