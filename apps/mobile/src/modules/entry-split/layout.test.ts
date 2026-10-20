import { FeedViewType } from "@follow/constants"
import { describe, expect, it, vi } from "vitest"

import { getEntrySplitListWidth, isEntrySplitLayoutWidth, viewOpensEntryReader } from "./layout"

// The breakpoint is the tablet layout's own, so the real one is under test
vi.mock("@/src/lib/responsive", () => import("../../lib/responsive"))
vi.mock("../../lib/platform", () => ({ isIOS: true }))
vi.mock("react-native", () => ({}))
vi.mock("react-native-safe-area-context", () => ({}))

describe("isEntrySplitLayoutWidth", () => {
  it("reads next to the list in every full-screen iPad window", () => {
    // iPad mini in portrait, an 11-inch iPad in portrait and a 13-inch iPad in landscape
    expect(isEntrySplitLayoutWidth(744)).toBe(true)
    expect(isEntrySplitLayoutWidth(834)).toBe(true)
    expect(isEntrySplitLayoutWidth(1376)).toBe(true)
  })

  it("pushes the reader in a window as narrow as a phone", () => {
    // iPhone, and an iPad window in Split View
    expect(isEntrySplitLayoutWidth(440)).toBe(false)
    expect(isEntrySplitLayoutWidth(678)).toBe(false)
  })
})

describe("getEntrySplitListWidth", () => {
  it("keeps the list as wide as on a phone in a portrait window", () => {
    expect(getEntrySplitListWidth(744)).toBe(320)
    expect(getEntrySplitListWidth(834)).toBe(320)
  })

  it("gives the list about a third of a wider window", () => {
    expect(getEntrySplitListWidth(1032)).toBe(372)
    expect(getEntrySplitListWidth(1133)).toBe(408)
  })

  it("leaves the rest of a landscape window to the reader", () => {
    expect(getEntrySplitListWidth(1210)).toBe(420)
    expect(getEntrySplitListWidth(1376)).toBe(420)
  })
})

describe("viewOpensEntryReader", () => {
  it("opens entries of text views in the reader", () => {
    expect(viewOpensEntryReader(FeedViewType.Articles)).toBe(true)
    expect(viewOpensEntryReader(FeedViewType.SocialMedia)).toBe(true)
    expect(viewOpensEntryReader(FeedViewType.Audios)).toBe(true)
    expect(viewOpensEntryReader(FeedViewType.Notifications)).toBe(true)
  })

  it("keeps the grids of pictures and videos, which open in the lightbox and the player", () => {
    expect(viewOpensEntryReader(FeedViewType.Pictures)).toBe(false)
    expect(viewOpensEntryReader(FeedViewType.Videos)).toBe(false)
  })
})
