import type { FeedState } from "./store"
import { useFeedStore } from "./store"

/**
 * The feed at an address. An address the server keeps its feed under another URL for, such as an
 * RSSHub instance address, finds the feed by that URL once it was looked up.
 */
export const findFeedByUrl = (state: FeedState, url: string) => {
  const feedUrl = state.resolvedUrls[url] ?? url
  return Object.values(state.feeds).find((feed) => feed.url === feedUrl)
}

export const getFeedById = (id: string | undefined | null) => {
  if (!id) return
  return useFeedStore.getState().feeds[id]
}

/**
 * The id the server knows a feed by. A feed it has not stored yet is previewed under a nonce id,
 * which the server refuses, so such a feed has none and is followed by its URL.
 */
export const getFeedServerId = (id: string | undefined | null) => {
  if (!id || getFeedById(id)?.nonce) return
  return id
}

export const getFeedByUrl = (url: string) => findFeedByUrl(useFeedStore.getState(), url)

export const getFeedByIdOrUrl = ({ id, url }: { id?: string; url?: string }) => {
  if (id) {
    return getFeedById(id)
  }
  if (url) {
    return getFeedByUrl(url)
  }
  return
}
