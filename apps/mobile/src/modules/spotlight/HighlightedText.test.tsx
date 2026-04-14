import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { SpotlightRule } from "@follow/shared/spotlight"

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
  it("adds only the native highlight background styling", () => {
    assert.deepEqual(getHighlightedTextSegmentStyle("#EF4444"), {
      backgroundColor: "#EF4444CC",
      borderRadius: 5,
      paddingHorizontal: 2,
    })
  })
})
