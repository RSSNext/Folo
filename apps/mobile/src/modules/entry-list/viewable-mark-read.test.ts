import { describe, expect, test } from "vitest"

import {
  getPendingMarkReadItems,
  shouldCollectViewableItemsForMarkRead,
} from "./viewable-mark-read"

describe("shouldCollectViewableItemsForMarkRead", () => {
  test("does not collect viewable items while disabled", () => {
    expect(
      shouldCollectViewableItemsForMarkRead({
        disabled: true,
        isScrollingDown: true,
        offset: 120,
      }),
    ).toBe(false)
  })

  test("collects viewable items only when scrolling down beyond the top", () => {
    expect(
      shouldCollectViewableItemsForMarkRead({
        disabled: false,
        isScrollingDown: true,
        offset: 120,
      }),
    ).toBe(true)
    expect(
      shouldCollectViewableItemsForMarkRead({
        disabled: false,
        isScrollingDown: false,
        offset: 120,
      }),
    ).toBe(false)
    expect(
      shouldCollectViewableItemsForMarkRead({
        disabled: false,
        isScrollingDown: true,
        offset: 0,
      }),
    ).toBe(false)
  })
})

describe("getPendingMarkReadItems", () => {
  const getId = (item: { key: string }) => item.key

  test("keeps the items that were not handed off yet", () => {
    const pending = { key: "b" }

    expect(
      getPendingMarkReadItems([{ key: "a" }, pending, { key: "c" }], new Set(["a", "c"]), getId),
    ).toEqual([pending])
  })

  // The hook marks the stored items whenever they change, and marking entries that are already
  // read resolves at once, so a new array for an unchanged or empty list would mark forever
  test("is null once every handed-off item was marked", () => {
    expect(getPendingMarkReadItems([{ key: "a" }], new Set(["a"]), getId)).toBeNull()
    expect(getPendingMarkReadItems(null, new Set(["a"]), getId)).toBeNull()
  })

  test("returns the same list when none of its items was handed off", () => {
    const items = [{ key: "a" }]
    const empty: { key: string }[] = []

    expect(getPendingMarkReadItems(items, new Set(["b"]), getId)).toBe(items)
    expect(getPendingMarkReadItems(empty, new Set(["a"]), getId)).toBe(empty)
  })
})
