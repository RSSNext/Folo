import { isOnboardingEntryUrl } from "@follow/store/constants/onboarding"
import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { useMemo } from "react"

/**
 * Where an entry's link leads outside the app, for opening, sharing and copying it, or null when
 * it leads nowhere there. The onboarding entries every account gets link to pages of the app
 * only. The server stores links as feeds give them, so a relative one resolves against the feed's
 * site, as desktop does.
 */
export const getExternalEntryUrl = (
  url: string | null | undefined,
  siteUrl?: string | null,
): string | null => {
  if (!url || isOnboardingEntryUrl(url)) return null
  // Already absolute, kept as the feed gave it
  if (URL.canParse(url)) return url

  if (!siteUrl || !URL.canParse(url, siteUrl)) return null
  const { href, protocol } = new URL(url, siteUrl)
  return protocol === "http:" || protocol === "https:" ? href : null
}

/** {@link getExternalEntryUrl} for an entry of the store */
export const useEntryExternalUrl = (entryId: string | undefined) => {
  const entry = useEntry(entryId, (state) => ({ url: state.url, feedId: state.feedId }))
  const feed = useFeedById(entry?.feedId, (feed) => ({ siteUrl: feed.siteUrl, url: feed.url }))
  const siteUrl = feed?.siteUrl || feed?.url
  return useMemo(() => getExternalEntryUrl(entry?.url, siteUrl), [entry?.url, siteUrl])
}
