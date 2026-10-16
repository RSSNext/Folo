import type { ActionItem } from "@follow/store/action/store"
import { describe, expect, test } from "vitest"

import { findRuleIndexWithInvalidRegex, generateExportFilename, getRegexError } from "./utils"

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
      ]),
    ).toBe(-1)
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
