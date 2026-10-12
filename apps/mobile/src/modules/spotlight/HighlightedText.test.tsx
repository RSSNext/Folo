import assert from "node:assert/strict"

import type { SpotlightRule } from "@follow/shared/spotlight"
import { describe, it } from "vitest"

import { getHighlightedTextSegments } from "./highlightedTextSegments"
import { getHighlightedTextSegmentStyle } from "./highlightedTextStyle"

const createRule = (overrides?: Partial<SpotlightRule>): SpotlightRule => ({
  id: "rule-1",
  enabled: true,
  pattern: "alert",
  patternType: "keyword",
  caseSensitive: false,
  color: "#EF4444",
  ...overrides,
})

describe("getHighlightedTextSegments", () => {
  it("builds native highlight segments from shared spotlight rules", () => {
    assert.deepEqual(getHighlightedTextSegments("Alert system alert", [createRule()]), [
      {
        text: "Alert",
        highlight: {
          color: "#EF4444",
          ruleId: "rule-1",
        },
      },
      {
        text: " system ",
        highlight: null,
      },
      {
        text: "alert",
        highlight: {
          color: "#EF4444",
          ruleId: "rule-1",
        },
      },
    ])
  })

  it("returns plain text when every rule is disabled", () => {
    assert.deepEqual(
      getHighlightedTextSegments("Alert system alert", [createRule({ enabled: false })]),
      [
        {
          text: "Alert system alert",
          highlight: null,
        },
      ],
    )
  })

  it("ignores disabled rules when mixed with enabled rules", () => {
    assert.deepEqual(
      getHighlightedTextSegments("Alert system alert", [
        createRule({ enabled: false }),
        createRule({ id: "rule-2", pattern: "system", color: "#3B82F6" }),
      ]),
      [
        {
          text: "Alert ",
          highlight: null,
        },
        {
          text: "system",
          highlight: {
            color: "#3B82F6",
            ruleId: "rule-2",
          },
        },
        {
          text: " alert",
          highlight: null,
        },
      ],
    )
  })
})

describe("getHighlightedTextSegmentStyle", () => {
  it("adds the highlight background with text that stays readable on it in any theme", () => {
    assert.deepEqual(getHighlightedTextSegmentStyle("#EF4444"), {
      backgroundColor: "#EF4444CC",
      borderRadius: 5,
      paddingHorizontal: 2,
      color: "#000000",
    })
    assert.equal(getHighlightedTextSegmentStyle("#1E3A8A").color, "#FFFFFF")
  })

  it("keeps the theme text color when the highlight color is not a hex color", () => {
    assert.equal("color" in getHighlightedTextSegmentStyle("red"), false)
  })
})
