import { FeedViewType } from "@follow/constants"
import { beforeAll, describe, expect, it, vi } from "vitest"

import type { FeedIconFeed } from "../../components/ui/icon/feed-icon"

let getEntryArtwork: typeof import("./artwork").getEntryArtwork

beforeAll(async () => {
  // The site icon helper reads the build flags of the shared constants
  vi.stubGlobal("ELECTRON", false)
  ;({ getEntryArtwork } = await import("./artwork"))
})

const createFeed = (overrides?: Partial<FeedIconFeed>): FeedIconFeed => ({
  id: "feed-1",
  ownerUserId: null,
  title: "NPR News Now",
  url: "https://feeds.npr.org/500005/podcast.xml",
  image: "https://media.npr.org/podcast-tile.jpg",
  siteUrl: "https://www.npr.org/podcasts/500005/npr-news-now",
  type: FeedViewType.Audios,
  ...overrides,
})

describe("getEntryArtwork", () => {
  it("uses the entry's own image", () => {
    expect(getEntryArtwork("https://media.npr.org/episode.jpg", createFeed())).toBe(
      "https://media.npr.org/episode.jpg",
    )
  })

  it("falls back to the feed image when the entry has no image", () => {
    expect(getEntryArtwork(null, createFeed())).toBe("https://media.npr.org/podcast-tile.jpg")
  })

  it("falls back to the site icon when the feed has no image either", () => {
    expect(getEntryArtwork(undefined, createFeed({ image: null }))).toBe(
      "https://icons.folo.is/www.npr.org",
    )
  })

  it("has no artwork without an image or a feed", () => {
    expect(getEntryArtwork(null, undefined)).toBeNull()
  })
})
