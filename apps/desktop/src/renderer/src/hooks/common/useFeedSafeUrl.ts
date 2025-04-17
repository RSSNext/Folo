import { resolveUrlWithBase } from "@follow/utils/utils"
import { useMemo } from "react"

import { useEntry } from "~/store/entry"
import { useFeedById } from "~/store/feed"
import { useInboxById } from "~/store/inbox"

export const useFeedSafeUrl = (entryId: string) => {
  const entry = useEntry(entryId)
  const feed = useFeedById(entry?.feedId)
  const inbox = useInboxById(entry?.inboxId, (inbox) => inbox !== null)

  return useMemo(() => {
    if (inbox) return entry?.entries.authorUrl
    const href = entry?.entries.url
    if (!href) return "#"

    if (href.startsWith("http")) {
      const domain = new URL(href).hostname
      if (domain === "localhost") return "#"

      return href
    }
    const feedSiteUrl = feed?.type === "feed" ? feed.siteUrl : null
    if (feedSiteUrl) return resolveUrlWithBase(href, feedSiteUrl)
    return href
  }, [entry?.entries.authorUrl, entry?.entries.url, feed?.type, inbox])
}
