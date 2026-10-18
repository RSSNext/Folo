import { describe, expect, it } from "vitest"

import { getPagerTabIndex } from "./pager-tab-index"

describe("getPagerTabIndex", () => {
  it("names the page the pager shows", () => {
    expect(getPagerTabIndex(0, 400, 2)).toBe(0)
    expect(getPagerTabIndex(390, 400, 2)).toBe(1)
    expect(getPagerTabIndex(150, 400, 2)).toBe(0)
  })

  it("knows no page before the tab bar has a width", () => {
    // The search pager scrolls to its page on mount, which can come before the first layout
    expect(getPagerTabIndex(400, 0, 2)).toBeUndefined()
    expect(getPagerTabIndex(0, 0, 2)).toBeUndefined()
    expect(getPagerTabIndex(Number.NaN, 400, 2)).toBeUndefined()
  })

  it("stays on a tab that exists", () => {
    expect(getPagerTabIndex(-60, 400, 2)).toBe(0)
    expect(getPagerTabIndex(1200, 400, 2)).toBe(1)
    expect(getPagerTabIndex(400, 400, 0)).toBeUndefined()
  })
})
