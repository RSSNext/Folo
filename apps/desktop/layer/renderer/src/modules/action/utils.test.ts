import type { ActionItem } from "@follow/store/action/store"
import { describe, expect, test } from "vitest"

import {
  findRuleIndexWithInvalidRegex,
  generateExportFilename,
  getRegexError,
  splitLeadingFlagGroup,
} from "./utils"

const rule = (condition: ActionItem["condition"], index = 0): ActionItem => ({
  name: `Rule ${index}`,
  condition,
  index,
  result: {},
})

describe("getRegexError", () => {
  test("accepts patterns that compile", () => {
    expect(getRegexError("(car|bottle|people)")).toBeNull()
    expect(getRegexError("")).toBeNull()
  })

  test("explains patterns that do not compile", () => {
    expect(getRegexError("([a-")).toMatch(/Invalid regular expression/)
  })

  test("accepts a leading flag group, which the server saves as a modifier group", () => {
    expect(getRegexError("(?i)news")).toBeNull()
    expect(getRegexError("(?ims)^breaking(?:news)?$")).toBeNull()
  })

  test("still checks the rest of a pattern after a leading flag group", () => {
    expect(getRegexError("(?i)(unclosed")).toMatch(/Invalid regular expression/)
    // The group would not cover all of it, or repeats a flag
    expect(getRegexError("(?i)a)(b")).toMatch(/Invalid regular expression/)
    expect(getRegexError("(?ii)news")).toMatch(/Invalid regular expression/)
    // Only a group at the start sets flags for the whole pattern
    expect(getRegexError("news(?i)")).toMatch(/Invalid regular expression/)
  })
})

describe("splitLeadingFlagGroup", () => {
  test("splits the flags of a leading bare group from the rest", () => {
    expect(splitLeadingFlagGroup("(?i)news")).toEqual({ flags: "i", rest: "news" })
    expect(splitLeadingFlagGroup("(?is)a\\)b")).toEqual({ flags: "is", rest: "a\\)b" })
  })

  test("leaves other patterns alone", () => {
    expect(splitLeadingFlagGroup("news")).toBeNull()
    expect(splitLeadingFlagGroup("(?i:news)")).toBeNull()
    expect(splitLeadingFlagGroup("(?x)news")).toBeNull()
    expect(splitLeadingFlagGroup("(?i)news\\")).toBeNull()
    expect(splitLeadingFlagGroup("(?i)[)]")).toEqual({ flags: "i", rest: "[)]" })
  })
})

describe("findRuleIndexWithInvalidRegex", () => {
  test("finds the rule whose regex condition does not compile", () => {
    const rules = [
      rule([[{ field: "entry_title", operator: "regex", value: "bitcoin|eth" }]], 0),
      rule([[{ field: "entry_title", operator: "contains", value: "(" }]], 1),
      rule([[], [{ field: "entry_content", operator: "regex", value: "(unclosed[" }]], 2),
    ]

    expect(findRuleIndexWithInvalidRegex(rules)).toBe(2)
  })

  test("returns -1 when every regex compiles", () => {
    expect(
      findRuleIndexWithInvalidRegex([
        rule([[{ field: "entry_title", operator: "regex", value: "^News" }]]),
        rule([[{ field: "entry_title", operator: "regex", value: "(?i)news" }]], 1),
      ]),
    ).toBe(-1)
  })

  test("passes over conditions as they were loaded, as the server does", () => {
    const legacy = rule([[{ field: "entry_title", operator: "regex", value: "a(?i)b" }]], 0)
    const loaded = [legacy, rule([[{ field: "entry_title", operator: "contains", value: "x" }]], 1)]

    // An unrelated edit saves although an older client stored a pattern RegExp rejects
    expect(
      findRuleIndexWithInvalidRegex(
        [legacy, rule([[{ field: "entry_title", operator: "contains", value: "y" }]], 1)],
        loaded,
      ),
    ).toBe(-1)
    // Changing that pattern, or the field it applies to, checks it again
    expect(
      findRuleIndexWithInvalidRegex(
        [rule([[{ field: "entry_title", operator: "regex", value: "a(?i)bc" }]], 0)],
        loaded,
      ),
    ).toBe(0)
    expect(
      findRuleIndexWithInvalidRegex(
        [rule([[{ field: "entry_content", operator: "regex", value: "a(?i)b" }]], 0)],
        loaded,
      ),
    ).toBe(0)
    // A new rule with the same broken pattern is not new to the server either
    expect(findRuleIndexWithInvalidRegex([...loaded, { ...legacy, index: 2 }], loaded)).toBe(-1)
  })
})

describe("generateExportFilename", () => {
  test("uses the local date and time", () => {
    // Just after local midnight, when the UTC date can still be the previous day
    expect(generateExportFilename(new Date(2026, 9, 12, 0, 30, 5))).toBe(
      "folo-actions-2026-10-12-00-30-05.json",
    )
  })
})
