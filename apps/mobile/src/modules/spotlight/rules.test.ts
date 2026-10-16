import type { SpotlightRule } from "@follow/shared/spotlight"
import { describe, expect, it } from "vitest"

import { dropSpotlightRuleWithoutPattern } from "./rules"

const createRule = (id: string, pattern: string): SpotlightRule => ({
  id,
  enabled: true,
  pattern,
  patternType: "keyword",
  caseSensitive: false,
  color: "#FDE68A",
})

describe("dropSpotlightRuleWithoutPattern", () => {
  it("removes the rule when its pattern is empty or only spaces", () => {
    const kept = createRule("kept", "AI")

    expect(dropSpotlightRuleWithoutPattern([kept, createRule("new", "")], "new")).toEqual([kept])
    expect(dropSpotlightRuleWithoutPattern([createRule("new", "  "), kept], "new")).toEqual([kept])
  })

  it("keeps the rules as they are when the rule has a pattern", () => {
    const rules = [createRule("rule", "AI")]

    expect(dropSpotlightRuleWithoutPattern(rules, "rule")).toBe(rules)
  })

  it("keeps the rules as they are when the rule is already gone", () => {
    const rules = [createRule("other", "")]

    expect(dropSpotlightRuleWithoutPattern(rules, "deleted")).toBe(rules)
  })
})
