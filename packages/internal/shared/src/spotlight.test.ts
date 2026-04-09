import { describe, expect, test } from "vitest"

import type { SpotlightRule } from "./spotlight"
import {
  defaultSpotlightColor,
  defaultSpotlightSettings,
  fromAppearanceSpotlightPayload,
  mergeAppearancePayloadWithSpotlightSettings,
  moveSpotlightRule,
  pickSpotlightPayloadFromRemoteAppearance,
  spotlightColorPresets,
  toAppearanceSpotlightPayload,
} from "./spotlight"

const createRule = (id: string): SpotlightRule => ({
  id,
  enabled: true,
  pattern: id,
  patternType: "keyword",
  caseSensitive: false,
  color: "#F97316",
})

describe("spotlight shared contract", () => {
  test("stores spotlight rules in a standalone settings object", () => {
    expect(defaultSpotlightSettings).toEqual({ spotlights: [] })
  })

  test("exports a stable preset highlight palette", () => {
    expect(defaultSpotlightColor).toBe(spotlightColorPresets[0]?.value)
    expect(spotlightColorPresets).toHaveLength(10)
    expect(spotlightColorPresets.map((preset) => preset.value)).toEqual([
      "#FDE68A",
      "#FACC15",
      "#A3E635",
      "#67E8F9",
      "#E879F9",
      "#FB7185",
      "#FDBA74",
      "#A78BFA",
      "#60A5FA",
      "#5EEAD4",
    ])
  })

  test("round-trips spotlight rules through the appearance payload", () => {
    const payload = toAppearanceSpotlightPayload({
      spotlights: [
        {
          id: "headline",
          enabled: true,
          pattern: "OpenAI",
          patternType: "keyword",
          caseSensitive: false,
          color: "#F97316",
        },
      ],
    })

    expect(payload).toEqual({
      spotlights: [
        expect.objectContaining({
          id: "headline",
          pattern: "OpenAI",
        }),
      ],
    })

    expect(fromAppearanceSpotlightPayload(payload)).toEqual({
      spotlights: payload.spotlights,
    })
  })

  test("clones the spotlight array when creating the appearance payload", () => {
    const settings = {
      spotlights: [createRule("headline")],
    }

    const payload = toAppearanceSpotlightPayload(settings)

    expect(payload).toEqual(settings)
    expect(payload.spotlights).not.toBe(settings.spotlights)
    expect(payload.spotlights[0]).not.toBe(settings.spotlights[0])
  })

  test("falls back to the default empty list when the payload value is not an array", () => {
    expect(fromAppearanceSpotlightPayload({ spotlights: "invalid" })).toEqual({
      spotlights: [],
    })
  })

  test("falls back to the default empty list when the top-level payload is nullish", () => {
    expect(fromAppearanceSpotlightPayload(null)).toEqual({ spotlights: [] })
    expect(fromAppearanceSpotlightPayload()).toEqual({ spotlights: [] })
  })

  test("filters malformed spotlight entries from the payload array", () => {
    expect(
      fromAppearanceSpotlightPayload({
        spotlights: [null, "abc", { id: "x" }],
      }),
    ).toEqual({
      spotlights: [],
    })
  })

  test("returns independent arrays for both payload and fallback paths", () => {
    const payload = {
      spotlights: [createRule("headline")],
    }

    const fromPayload = fromAppearanceSpotlightPayload(payload)
    const fromFallback = fromAppearanceSpotlightPayload({ spotlights: "invalid" })

    expect(fromPayload).toEqual(payload)
    expect(fromPayload.spotlights).not.toBe(payload.spotlights)
    expect(fromPayload.spotlights[0]).not.toBe(payload.spotlights[0])
    expect(fromFallback).toEqual({ spotlights: [] })
    expect(fromFallback.spotlights).not.toBe(defaultSpotlightSettings.spotlights)
  })

  test("moves a rule upward without mutating the original array", () => {
    const rules = [createRule("first"), createRule("second"), createRule("third")]

    expect(moveSpotlightRule(rules, 2, -1).map((rule) => rule.id)).toEqual([
      "first",
      "third",
      "second",
    ])
    expect(rules.map((rule) => rule.id)).toEqual(["first", "second", "third"])
  })

  test("does not reorder or mutate when the source index is invalid", () => {
    const rules = [createRule("first"), createRule("second"), createRule("third")]

    expect(moveSpotlightRule(rules, -1, 1).map((rule) => rule.id)).toEqual([
      "first",
      "second",
      "third",
    ])
    expect(moveSpotlightRule(rules, 3, -1).map((rule) => rule.id)).toEqual([
      "first",
      "second",
      "third",
    ])
    expect(rules.map((rule) => rule.id)).toEqual(["first", "second", "third"])
  })
})

describe("spotlight transport", () => {
  test("merges spotlight settings into an appearance payload without dropping appearance fields", () => {
    const spotlightSettings = {
      spotlights: [createRule("priority")],
    }

    const payload = mergeAppearancePayloadWithSpotlightSettings(
      {
        accentColor: "orange",
        uiFontFamily: "system-ui",
      },
      spotlightSettings,
      1710000000000,
    )

    expect(payload).toEqual({
      accentColor: "orange",
      uiFontFamily: "system-ui",
      spotlightsUpdated: 1710000000000,
      spotlights: [
        expect.objectContaining({
          id: "priority",
          pattern: "priority",
        }),
      ],
    })
    expect(payload.spotlights).not.toBe(spotlightSettings.spotlights)
    expect(payload.spotlights[0]).not.toBe(spotlightSettings.spotlights[0])
  })

  test("extracts spotlight settings from the mixed remote appearance payload", () => {
    expect(
      pickSpotlightPayloadFromRemoteAppearance(
        {
          accentColor: "orange",
          spotlightsUpdated: 1710000000100,
          spotlights: [
            {
              id: "priority",
              enabled: true,
              pattern: "urgent",
              patternType: "keyword",
              caseSensitive: false,
              color: "#EF4444",
            },
          ],
        },
        1710000000000,
      ),
    ).toEqual({
      updated: 1710000000100,
      spotlights: [
        expect.objectContaining({
          id: "priority",
          pattern: "urgent",
        }),
      ],
    })
  })
})
