import { describe, expect, it } from "vitest"

import { validateSpotlightPattern } from "./spotlight"

describe("validateSpotlightPattern", () => {
  it("accepts a keyword and a valid regex", () => {
    expect(validateSpotlightPattern("folo", "keyword")).toEqual({ valid: true })
    expect(validateSpotlightPattern("(closed)", "regex")).toEqual({ valid: true })
  })

  it.each(["keyword", "regex"] as const)("marks a blank %s pattern as empty", (patternType) => {
    expect(validateSpotlightPattern("  ", patternType)).toEqual({ valid: false, reason: "empty" })
  })

  it.each([
    ["[abc", "Unterminated character class"],
    ["(unclosed", "Unterminated group"],
  ])("explains why %s is not a valid regex, without the engine's prefix", (pattern, error) => {
    expect(validateSpotlightPattern(pattern, "regex")).toEqual({
      valid: false,
      reason: "regex",
      error,
    })
  })
})
