import { createElement } from "react"
import { describe, expect, test } from "vitest"

import { getGroupedListChildKey } from "./grouped-list-key"

describe("getGroupedListChildKey", () => {
  test("falls back to the child index when element keys are missing", () => {
    const children = [createElement("first"), createElement("second")]

    expect(children.map(getGroupedListChildKey)).toEqual([0, 1])
  })

  test("preserves an explicit element key", () => {
    expect(getGroupedListChildKey(createElement("child", { key: "account" }), 3)).toBe("account")
  })

  test("uses the child index for non-elements", () => {
    expect(getGroupedListChildKey("label", 2)).toBe(2)
  })
})
