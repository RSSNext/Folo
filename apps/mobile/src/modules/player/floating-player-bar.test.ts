import { describe, expect, it } from "vitest"

import type { Route } from "@/src/lib/navigation/ChainNavigationContext"

import { isRootStackPushedScreenOnTop } from "./floating-player-bar"

describe("isRootStackPushedScreenOnTop", () => {
  it.each<{ expected: boolean; routes: Pick<Route, "type">[]; scenario: string }>([
    { expected: false, routes: [], scenario: "a tab root" },
    { expected: true, routes: [{ type: "push" }], scenario: "an article opened from a timeline" },
    {
      expected: true,
      routes: [{ type: "push" }, { type: "push" }],
      scenario: "an article opened from a folder timeline",
    },
    {
      expected: false,
      routes: [{ type: "push" }, { type: "transparentModal" }],
      scenario: "the player screen over an article",
    },
    { expected: false, routes: [{ type: "formSheet" }], scenario: "a form sheet over a tab root" },
    {
      expected: false,
      routes: [{ type: "modal" }, { type: "push" }],
      scenario: "a screen pushed inside a modal",
    },
  ])("returns $expected for $scenario", ({ expected, routes }) => {
    expect(isRootStackPushedScreenOnTop(routes)).toBe(expected)
  })
})
