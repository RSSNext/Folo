import { useFeedStore } from "./store"

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

export const getFeedByUrl = (url: string) => {
  const { feeds } = useFeedStore.getState()
  return Object.values(feeds).find((feed) => feed.url === url)
}

export const getFeedByIdOrUrl = ({ id, url }: { id?: string; url?: string }) => {
  if (id) {
    return getFeedById(id)
  }
  if (url) {
    return getFeedByUrl(url)
  }
  return
}
