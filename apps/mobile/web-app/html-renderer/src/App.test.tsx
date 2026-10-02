import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, test, vi } from "vitest"

import type { EntryModel } from "../types"
import { App } from "./App"

const coverImageUrl = "https://example.com/images/cover.jpg"

const renderEntry = (entry: EntryModel) => {
  window.__FO_BRIDGE__.dispatch("setEntry", JSON.stringify(entry))
  const container = document.createElement("div")
  container.innerHTML = renderToStaticMarkup(<App />)
  return container.querySelector("article")
}

describe("onboarding Markdown", () => {
  beforeEach(() => {
    vi.stubGlobal("bridge", { measure: vi.fn() })
    window.__FO_BRIDGE__.dispatch("setNoMedia", "false")
  })

  test("renders headings, emphasis and images through the regular article renderer", () => {
    const article = renderEntry({
      url: "folo://onboarding/1",
      content: `Welcome to **Folo**.\n\n### Your Subscriptions\n\n![Guide](${coverImageUrl})`,
    })

    expect(article?.querySelector("h3")?.textContent).toBe("Your Subscriptions")
    expect(article?.querySelector("strong")?.textContent).toBe("Folo")
    expect(article?.querySelector("button img")?.getAttribute("src")).toBe(coverImageUrl)
    expect(article?.textContent).not.toContain("###")
  })

  test("keeps media hiding and HTML sanitization for onboarding content", () => {
    window.__FO_BRIDGE__.dispatch("setNoMedia", "true")
    const article = renderEntry({
      url: "folo://onboarding/1",
      content: `### Guide\n\n![Guide](${coverImageUrl})\n\n[Unsafe](javascript:alert(1))`,
    })

    expect(article?.querySelector("h3")?.textContent).toBe("Guide")
    expect(article?.querySelector("img")).toBeNull()
    expect(article?.innerHTML).not.toContain("javascript:")
  })

  test("leaves ordinary HTML article text unchanged", () => {
    const article = renderEntry({
      url: "https://example.com/article",
      content: "<p>Literal **asterisks** and ### hashes</p>",
    })

    expect(article?.querySelector("p")?.textContent).toBe("Literal **asterisks** and ### hashes")
    expect(article?.querySelector("strong, h3")).toBeNull()
  })
})

describe("entry cover image", () => {
  beforeEach(() => {
    vi.stubGlobal("bridge", { measure: vi.fn() })
    window.__FO_BRIDGE__.dispatch("setNoMedia", "false")
  })

  test("renders a cover without body content through the image preview component", () => {
    const article = renderEntry({
      media: [{ type: "photo", url: coverImageUrl }],
    })

    expect(article?.querySelectorAll("img")).toHaveLength(1)
    expect(article?.querySelector("button img")?.getAttribute("src")).toBe(coverImageUrl)
  })

  test("uses the article URL to avoid repeating an existing relative cover image", () => {
    const article = renderEntry({
      content: '<p>Article body</p><img src="/images/cover.jpg">',
      url: "https://example.com/articles/entry",
      media: [{ type: "photo", url: coverImageUrl }],
    })

    expect(article?.querySelectorAll("img")).toHaveLength(1)
    expect(article?.querySelector("img")?.getAttribute("src")).toBe(coverImageUrl)
    expect(article?.firstElementChild?.textContent).toBe("Article body")
  })

  test("does not promote another photo when the cover media is a video", () => {
    const article = renderEntry({
      content: "<p>Article body</p>",
      media: [
        { type: "video", url: "https://example.com/video.mp4" },
        { type: "photo", url: coverImageUrl },
      ],
    })

    expect(article?.querySelectorAll("img")).toHaveLength(0)
  })

  test("respects the media visibility setting for a cover-only entry", () => {
    window.__FO_BRIDGE__.dispatch("setNoMedia", "true")

    const article = renderEntry({
      media: [{ type: "photo", url: coverImageUrl }],
    })

    expect(article).toBeNull()
  })
})

describe("reader style", () => {
  beforeEach(() => {
    vi.stubGlobal("bridge", { measure: vi.fn() })
    window.__FO_BRIDGE__.dispatch("setNoMedia", "false")
  })

  test("applies font family, line height and text color variables to the article", () => {
    window.__FO_BRIDGE__.dispatch(
      "setReaderStyle",
      JSON.stringify({
        fontFamily: "ui-serif, serif",
        lineHeight: 1.5,
        textColor: {
          light: { body: "#111111", strong: "#000000" },
          dark: { body: "#eeeeee", strong: "#ffffff" },
        },
      }),
    )
    const article = renderEntry({ content: "<p>Body</p>" })
    const style = article?.getAttribute("style") ?? ""

    expect(style).toContain("font-family:ui-serif, serif")
    expect(style).toContain("line-height:1.5")
    expect(style).toContain("--reader-body-light:#111111")
    expect(style).toContain("--reader-strong-dark:#ffffff")
    expect(article?.classList.contains("reader-text-color")).toBe(true)
  })

  test("keeps renderer defaults when the reader style is reset", () => {
    window.__FO_BRIDGE__.dispatch(
      "setReaderStyle",
      JSON.stringify({ fontFamily: "inherit", lineHeight: 1.75, textColor: null }),
    )
    const article = renderEntry({ content: "<p>Body</p>" })
    const style = article?.getAttribute("style") ?? ""

    expect(style).not.toContain("font-family")
    expect(style).toContain("line-height:1.75")
    expect(style).not.toContain("--reader-body-light")
    expect(article?.classList.contains("reader-text-color")).toBe(false)
  })
})
