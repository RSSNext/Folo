import type { FeedViewType } from "@follow/constants"
import { getViewList } from "@follow/constants"

/**
 * The view a link asks to follow a feed in, such as the `view` the web's "Open in Folo" adds,
 * when it names one the form offers. Otherwise the feed's own view applies.
 */
export const parseLinkView = (view: string | null | undefined): FeedViewType | undefined => {
  if (!view || !/^\d+$/.test(view)) return undefined
  const value = Number(view)
  return getViewList().some((item) => item.view === value) ? (value as FeedViewType) : undefined
}
