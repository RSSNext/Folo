import { describe, expect, it } from "vitest"

import * as parsers from "./link-parser"

const platformOf = (url: string) =>
  Object.values(parsers).find((parser) => parser(url).validate)?.parserName

describe("link parsers", () => {
  it("recognizes Telegram links", () => {
    expect(platformOf("https://t.me/durov")).toBe("telegram")
    expect(platformOf("https://durov.t.me/")).toBe("telegram")
  })

  it.each(["https://about.meta.com/news", "https://matt.medium.com/", "https://about.me/someone"])(
    "does not take %s for Telegram",
    (url) => {
      expect(platformOf(url)).toBeUndefined()
    },
  )
})
