import { resolveUrlWithBase } from "@follow/utils/utils"
import { useMemo } from "react"

import { useEntry } from "~/store/entry"
import { useFeedById } from "~/store/feed"
import { useInboxById } from "~/store/inbox"

export const useFeedSafeUrl = (entryId: string) => {
  const entry = useEntry(entryId, (state) => {
    return {
      feedId: state.feedId,
      inboxId: state.inboxId,
      url: state.entries.url,
      authorUrl: state.entries.authorUrl,
    }
  })

  const feed = useFeedById(entry?.feedId, (feed) => ({
    type: feed?.type,
    siteUrl: feed?.siteUrl,
  }))
  const inbox = useInboxById(entry?.inboxId, (inbox) => inbox !== null)

  return useMemo(() => {
    if (inbox) return entry?.authorUrl
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
  }, [entry?.authorUrl, entry?.url, feed?.type, feed?.siteUrl, inbox])
}
