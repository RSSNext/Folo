import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { useIsInbox } from "@follow/store/inbox/hooks"
import { resolveUrlWithBase } from "@follow/utils/utils"
import { useMemo } from "react"

export const useFeedSafeUrl = (entryId: string) => {
  const entry = useEntry(entryId, (state) => {
    return {
      feedId: state.feedId,
      inboxId: state.inboxHandle,
      url: state.url,
      authorUrl: state.authorUrl,
    }
  })

  const feed = useFeedById(entry?.feedId, (feed) => ({
    type: feed?.type,
    siteUrl: feed?.siteUrl,
  }))
  const isInbox = useIsInbox(entry?.inboxId)

  return useMemo(() => {
    if (isInbox) return entry?.authorUrl
    const href = entry?.url
    if (!href) return "#"

    if (href.startsWith("http")) {
      const domain = new URL(href).hostname
      if (domain === "localhost") return "#"

      return href
    }
    const feedSiteUrl = feed?.type === "feed" ? feed?.siteUrl : null
    if (feedSiteUrl) return resolveUrlWithBase(href, feedSiteUrl)
    return href
  }, [entry?.authorUrl, entry?.url, feed?.type, feed?.siteUrl, isInbox])
}
