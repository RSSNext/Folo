import { describe, expect, it } from "vitest"

import { parseSocialMedia } from "./parsers"

describe("parseSocialMedia", () => {
  it("reads the handle from a profile url", () => {
    expect(parseSocialMedia("https://x.com/karpathy")?.meta.handle).toBe("karpathy")
    expect(parseSocialMedia("https://x.com/karpathy/")?.meta.handle).toBe("karpathy")
  })

  it("reads the author handle from a post url instead of the post id", () => {
    expect(
      parseSocialMedia("https://twitter.com/karpathy/status/2109361546505966046")?.meta.handle,
    ).toBe("karpathy")
  })

  it("ignores x.com routes that are not handles", () => {
    expect(parseSocialMedia("https://x.com/i/web/status/2109361546505966046")).toBeUndefined()
    expect(parseSocialMedia("https://x.com/search?q=folo")).toBeUndefined()
    expect(parseSocialMedia("https://x.com/")).toBeUndefined()
  })

  it("ignores other sites and missing urls", () => {
    expect(parseSocialMedia("https://news.ycombinator.com/item?id=1")).toBeUndefined()
    expect(parseSocialMedia("50047422")).toBeUndefined()
    expect(parseSocialMedia(null)).toBeUndefined()
  })
})
