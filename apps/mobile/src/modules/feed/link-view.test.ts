import { FeedViewType } from "@follow/constants"
import { describe, expect, it } from "vitest"

import { parseLinkView } from "./link-view"

describe("parseLinkView", () => {
  it("takes the view a link names", () => {
    expect(parseLinkView("0")).toBe(FeedViewType.Articles)
    expect(parseLinkView("2")).toBe(FeedViewType.Pictures)
    expect(parseLinkView("3")).toBe(FeedViewType.Videos)
  })

  it("leaves views the form does not offer to the feed", () => {
    expect(parseLinkView("-1")).toBeUndefined()
    expect(parseLinkView("42")).toBeUndefined()
    expect(parseLinkView("2.5")).toBeUndefined()
    expect(parseLinkView("pictures")).toBeUndefined()
    expect(parseLinkView("")).toBeUndefined()
    expect(parseLinkView(null)).toBeUndefined()
    expect(parseLinkView(undefined)).toBeUndefined()
  })
})
