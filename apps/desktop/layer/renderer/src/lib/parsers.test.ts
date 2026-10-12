import { describe, expect, it } from "vitest"

import { isXFeed, parseEntrySocialMedia, parseSocialMedia } from "./parsers"

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

describe("parseEntrySocialMedia", () => {
  const post = { url: "https://x.com/karpathy/status/2109361546505966046" }
  const hackerNews = {
    url: "https://news.ycombinator.com/rss",
    siteUrl: "https://news.ycombinator.com/",
  }

  it("reads the X author of an entry of an X feed", () => {
    expect(
      parseEntrySocialMedia(post, { url: "rsshub://twitter/user/karpathy", siteUrl: null })?.meta
        .handle,
    ).toBe("karpathy")
    expect(
      parseEntrySocialMedia(post, {
        url: "https://rsshub.example/twitter/list/1",
        siteUrl: "https://x.com/i/lists/1",
      })?.meta.handle,
    ).toBe("karpathy")
  })

  it("leaves out the author of a post that an entry of another feed links to", () => {
    expect(parseEntrySocialMedia(post, hackerNews)).toBeUndefined()
    expect(parseEntrySocialMedia(post, null)).toBeUndefined()
  })
})

describe("isXFeed", () => {
  it("knows X feeds by their RSSHub route or their site", () => {
    expect(isXFeed({ url: "rsshub://twitter/user/karpathy" })).toBe(true)
    expect(
      isXFeed({ url: "https://nitter.example/karpathy/rss", siteUrl: "https://x.com/karpathy" }),
    ).toBe(true)
    expect(
      isXFeed({ url: "https://example.com/feed", siteUrl: "https://twitter.com/folo_is" }),
    ).toBe(true)
    expect(
      isXFeed({
        url: "rsshub://github/issue/DIYgod/RSSHub",
        siteUrl: "https://github.com/DIYgod/RSSHub/issues",
      }),
    ).toBe(false)
    expect(
      isXFeed({
        url: "https://news.ycombinator.com/rss",
        siteUrl: "https://news.ycombinator.com/",
      }),
    ).toBe(false)
  })
})
