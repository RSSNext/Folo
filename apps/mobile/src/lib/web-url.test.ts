import { describe, expect, it } from "vitest"

import { isWebUrl } from "./web-url"

describe("isWebUrl", () => {
  it("accepts http and https pages", () => {
    expect(isWebUrl("https://example.com/post")).toBe(true)
    expect(isWebUrl("http://localhost:1200/test")).toBe(true)
    expect(isWebUrl("HTTPS://EXAMPLE.COM")).toBe(true)
  })

  it("leaves other links to the apps that handle them", () => {
    expect(isWebUrl("mailto:editor@example.test")).toBe(false)
    expect(isWebUrl("tel:+15555555")).toBe(false)
    expect(isWebUrl("folo://onboarding/entry/1")).toBe(false)
    expect(isWebUrl("javascript:alert(1)")).toBe(false)
  })

  it("refuses links without a scheme", () => {
    expect(isWebUrl("/posts/relative-1")).toBe(false)
    expect(isWebUrl("")).toBe(false)
  })
})
