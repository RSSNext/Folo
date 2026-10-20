import { FeedViewType } from "@follow/constants"

import { isTabletLayoutWidth } from "@/src/lib/responsive"

/** The list takes about a third of the window, within the widths a phone shows it at */
const LIST_WIDTH_RATIO = 0.36
const MIN_LIST_WIDTH = 320
const MAX_LIST_WIDTH = 420

/**
 * Whether a window this wide reads entries next to the list instead of pushing them over it. It
 * is the tablet layout: every full-screen iPad window in either orientation, but not Split View,
 * Slide Over or a window resized as narrow as a phone.
 */
export const isEntrySplitLayoutWidth = (windowWidth: number) => isTabletLayoutWidth(windowWidth)

export const getEntrySplitListWidth = (windowWidth: number) =>
  Math.round(Math.min(Math.max(windowWidth * LIST_WIDTH_RATIO, MIN_LIST_WIDTH), MAX_LIST_WIDTH))

/** Pictures and videos open in the lightbox and the player, so their grids keep the whole width */
export const viewOpensEntryReader = (view: FeedViewType | undefined) =>
  view !== FeedViewType.Pictures && view !== FeedViewType.Videos
