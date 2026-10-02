import { runInNewContext, Script } from "node:vm"

import { describe, expect, it } from "vitest"

import { getImageProxyUrl } from "../../../lib/img-proxy"
import { atStart, imageProxyFallback } from "./injected-js"

type FakeElement = {
  tagName: string
  getAttribute: (name: string) => string | null
  setAttribute: (name: string, value: string) => void
}

const createElement = (tagName: string, src?: string): FakeElement => {
  const attributes = new Map<string, string>()
  if (src !== undefined) attributes.set("src", src)
  return {
    tagName,
    getAttribute: (name) => attributes.get(name) ?? null,
    setAttribute: (name, value) => {
      attributes.set(name, value)
    },
  }
}

const installFallback = () => {
  const listeners: { listener: (event: { target: unknown }) => void; capture: unknown }[] = []
  runInNewContext(imageProxyFallback, {
    window: {
      addEventListener: (
        type: string,
        listener: (event: { target: unknown }) => void,
        capture?: unknown,
      ) => {
        if (type === "error") listeners.push({ listener, capture })
      },
    },
  })

  expect(listeners).toHaveLength(1)
  const [{ listener, capture }] = listeners as [(typeof listeners)[number]]
  return {
    capture,
    fail: (element: FakeElement) => {
      listener({ target: element })
      return element.getAttribute("src")
    },
  }
}

describe("imageProxyFallback", () => {
  it("is part of the Android document start script", () => {
    expect(atStart).toContain(imageProxyFallback)
    expect(() => new Script(atStart)).not.toThrow()
  })

  it("listens in the capture phase because resource errors do not bubble", () => {
    expect(installFallback().capture).toBe(true)
  })

  it("retries a failed image through the image proxy", () => {
    const { fail } = installFallback()
    const url = "https://cdnfile.sspai.com/2025/01/01/a.png?imageView2/2/w/1120&q=90#hash"

    expect(fail(createElement("IMG", url))).toBe(getImageProxyUrl({ url }))
    expect(fail(createElement("IMG", "https://wx1.sinaimg.cn/large/a.jpg"))).toBe(
      `https://img.folo.is?url=${encodeURIComponent("https://wx1.sinaimg.cn/large/a.jpg")}&width=&height=`,
    )
  })

  it("normalizes http and protocol-relative sources", () => {
    const { fail } = installFallback()

    expect(fail(createElement("IMG", "http://example.com/a.png"))).toBe(
      getImageProxyUrl({ url: "http://example.com/a.png" }),
    )
    expect(fail(createElement("IMG", " //example.com/a.png "))).toBe(
      getImageProxyUrl({ url: "https://example.com/a.png" }),
    )
  })

  it("does not retry a failed proxy request", () => {
    const { fail } = installFallback()
    const image = createElement("IMG", "https://example.com/a.png")

    const proxied = fail(image)
    expect(proxied).toBe(getImageProxyUrl({ url: "https://example.com/a.png" }))
    expect(fail(image)).toBe(proxied)
  })

  it("retries again when the element is reused for another image", () => {
    const { fail } = installFallback()
    const image = createElement("IMG", "https://example.com/a.png")

    fail(image)
    fail(image)
    image.setAttribute("src", "https://example.com/b.png")

    expect(fail(image)).toBe(getImageProxyUrl({ url: "https://example.com/b.png" }))
  })

  it("ignores non-image targets and sources the proxy cannot fetch", () => {
    const { fail } = installFallback()

    expect(fail(createElement("SCRIPT", "https://example.com/a.js"))).toBe(
      "https://example.com/a.js",
    )
    expect(fail(createElement("IMG"))).toBeNull()
    expect(fail(createElement("IMG", "data:image/png;base64,AAAA"))).toBe(
      "data:image/png;base64,AAAA",
    )
    expect(fail(createElement("IMG", "/relative/a.png"))).toBe("/relative/a.png")
    expect(fail(createElement("IMG", "file:///android_asset/a.png"))).toBe(
      "file:///android_asset/a.png",
    )
  })
})
