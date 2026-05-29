import { describe, expect, it } from "vitest"

import { createLinkShareContent } from "./share"

describe("createLinkShareContent", () => {
  it("uses a single URL item on iOS", () => {
    const url = "https://example.com/post/1"

    const content = createLinkShareContent({
      platform: "ios",
      title: "Post title",
      url,
      message: url,
    })

    expect(content).toEqual({
      title: "Post title",
      url,
    })
    expect(content).not.toHaveProperty("message")
  })

  it("uses a single text item on Android", () => {
    const url = "https://example.com/post/1"
    const message = `Check out this post: ${url}`

    const content = createLinkShareContent({
      platform: "android",
      title: "Post title",
      url,
      message,
    })

    expect(content).toEqual({
      title: "Post title",
      message,
    })
    expect(content).not.toHaveProperty("url")
  })

  it("falls back to the URL as Android share text", () => {
    const url = "https://example.com/post/1"

    expect(
      createLinkShareContent({
        platform: "android",
        title: "Post title",
        url,
      }),
    ).toEqual({
      title: "Post title",
      message: url,
    })
  })
})
