import { describe, expect, test } from "vitest"

import { createAuthRequestOriginHeaders } from "./headers"

describe("createAuthRequestOriginHeaders", () => {
  test("uses the web origin for auth requests", () => {
    expect(createAuthRequestOriginHeaders("https://app.folo.is/login?from=desktop")).toEqual({
      Origin: "https://app.folo.is",
      Referer: "https://app.folo.is",
    })
  })

  test("returns empty headers for invalid urls", () => {
    expect(createAuthRequestOriginHeaders("not-a-url")).toEqual({})
  })
})
