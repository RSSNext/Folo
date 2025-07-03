import { useFeedStore } from "./store"

export const getFeedById = (id: string | undefined) => {
  if (!id) return
  return useFeedStore.getState().feeds[id]
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
