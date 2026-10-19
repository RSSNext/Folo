import { describe, expect, it, vi } from "vitest"

import { getExternalEntryUrl } from "./external-url"

// The store itself needs the app's globals; the onboarding check only reads the URL
vi.mock("@follow/store/entry/getter", () => ({ getEntry: vi.fn() }))
vi.mock("@follow/store/entry/hooks", () => ({ useEntry: vi.fn() }))
vi.mock("@follow/store/feed/hooks", () => ({ useFeedById: vi.fn() }))

describe("getExternalEntryUrl", () => {
  it("keeps an absolute link as the feed gave it", () => {
    expect(getExternalEntryUrl("https://example.com/post?id=1", "https://example.com")).toBe(
      "https://example.com/post?id=1",
    )
    expect(getExternalEntryUrl("https://example.com", null)).toBe("https://example.com")
    expect(getExternalEntryUrl("mailto:editor@example.test", null)).toBe(
      "mailto:editor@example.test",
    )
  })

  it("has no link outside the app for the onboarding entries", () => {
    expect(getExternalEntryUrl("folo://onboarding/entry/1", "https://folo.is")).toBeNull()
  })

  it("resolves a relative link against the feed's site", () => {
    expect(getExternalEntryUrl("/posts/relative-1", "https://example.com/blog")).toBe(
      "https://example.com/posts/relative-1",
    )
    expect(getExternalEntryUrl("posts/relative-1", "https://example.com/blog/")).toBe(
      "https://example.com/blog/posts/relative-1",
    )
    expect(getExternalEntryUrl("//cdn.example.com/a", "https://example.com")).toBe(
      "https://cdn.example.com/a",
    )
  })

  it("has no link when a relative one cannot be resolved to a web page", () => {
    expect(getExternalEntryUrl("/posts/relative-1", null)).toBeNull()
    expect(getExternalEntryUrl("/posts/relative-1", "folo://onboarding")).toBeNull()
    expect(getExternalEntryUrl("", "https://example.com")).toBeNull()
    expect(getExternalEntryUrl(null, "https://example.com")).toBeNull()
  })
})
