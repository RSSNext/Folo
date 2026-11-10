import { describe, expect, it } from "vitest"

import { getNotionArticleContent, getNotionPageUrl } from "./notion-article"

describe("getNotionArticleContent", () => {
  it("uses the displayed readability content when ready", () => {
    expect(
      getNotionArticleContent({ content: "<p>Feed</p>", readabilityContent: "<p>Full</p>" }, true),
    ).toBe("<p>Full</p>")
  })

  it("does not export stale readability content when original content is displayed", () => {
    expect(
      getNotionArticleContent({ content: "<p>Feed</p>", readabilityContent: "<p>Full</p>" }, false),
    ).toBe("<p>Feed</p>")
  })

  it("falls back to feed content when readability is empty", () => {
    expect(getNotionArticleContent({ content: "<p>Feed</p>" }, true)).toBe("<p>Feed</p>")
  })

  it("does not manufacture content when no body is available", () => {
    expect(getNotionArticleContent({}, false)).toBe("")
  })
})

describe("getNotionPageUrl", () => {
  it("allows HTTPS Notion pages", () => {
    expect(getNotionPageUrl("https://www.notion.so/page")).toBe("https://www.notion.so/page")
    expect(getNotionPageUrl("https://workspace.notion.site/page")).toBe(
      "https://workspace.notion.site/page",
    )
  })

  it("rejects unsafe or lookalike destinations", () => {
    for (const url of [
      "http://notion.so/page",
      "https://notion.so.evil.example/page",
      "https://notnotion.so/page",
      "javascript:alert(1)",
      "https://user:secret@notion.so/page",
      "https://notion.so:8443/page",
      "invalid",
    ]) {
      expect(getNotionPageUrl(url)).toBeNull()
    }
  })
})

it("selects cached summary for the actual exported content fallback", async () => {
  const { getNotionCachedSummary } = await import("./notion-article")
  const cached = { summary: "Original", readabilitySummary: "Full" }
  expect(getNotionCachedSummary({}, true, cached)).toBe("Original")
  expect(getNotionCachedSummary({ readabilityContent: "Full body" }, true, cached)).toBe("Full")
  expect(
    getNotionCachedSummary({ readabilityContent: "Full body" }, true, {
      summary: "Original",
      readabilitySummary: null,
    }),
  ).toBeUndefined()
  expect(getNotionCachedSummary({}, false, undefined)).toBeUndefined()
})
