import type { FeedIconFeed } from "../../components/ui/icon/feed-icon"
import { getFeedIconSource } from "../../lib/image"

/**
 * Artwork for an entry played in the player: the entry's image, or the feed icon that the entry
 * list shows when the entry has no image or it failed to load.
 */
export const getEntryArtwork = (
  image: string | null | undefined,
  feed: FeedIconFeed | null | undefined,
): string | null => image || getFeedIconSource(feed ?? undefined) || null
