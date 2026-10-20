import { describe, expect, it } from "vitest"

import {
  appendLoadedEntryIds,
  getAdjacentEntryIds,
  shouldLoadMoreEntries,
} from "./adjacent-entries"

describe("getAdjacentEntryIds", () => {
  it("finds the entries around the open one", () => {
    expect(getAdjacentEntryIds(["a", "b", "c"], "b")).toEqual({
      previousEntryId: "a",
      nextEntryId: "c",
    })
  })

  it("has nothing before the first entry or after the last one", () => {
    expect(getAdjacentEntryIds(["a", "b"], "a")).toEqual({
      previousEntryId: undefined,
      nextEntryId: "b",
    })
    expect(getAdjacentEntryIds(["a", "b"], "b")).toEqual({
      previousEntryId: "a",
      nextEntryId: undefined,
    })
  })

  it("has nothing around an entry the list does not have", () => {
    expect(getAdjacentEntryIds(["a", "b"], "z")).toEqual({})
    expect(getAdjacentEntryIds([], "a")).toEqual({})
  })
})

describe("appendLoadedEntryIds", () => {
  it("appends the next page the list loaded", () => {
    expect(appendLoadedEntryIds(["a", "b"], ["a", "b", "c", "d"])).toEqual(["a", "b", "c", "d"])
  })

  it("keeps the opened entries when the list has nothing new", () => {
    const opened = ["a", "b"]
    expect(appendLoadedEntryIds(opened, ["a", "b"])).toBe(opened)
    expect(appendLoadedEntryIds(opened, [])).toBe(opened)
  })

  it("leaves entries added above the opened ones out", () => {
    expect(appendLoadedEntryIds(["a", "b"], ["new", "a", "b", "c"])).toEqual(["a", "b", "c"])
  })

  it("appends after the last opened entry the list still has", () => {
    // The list dropped the last opened entry, as a refresh of unread entries does once it is read
    expect(appendLoadedEntryIds(["a", "b", "c"], ["a", "b", "d"])).toEqual(["a", "b", "c", "d"])
  })

  it("does not repeat opened entries the list moved further down", () => {
    expect(appendLoadedEntryIds(["a", "b", "c"], ["a", "c", "d", "b"])).toEqual([
      "a",
      "b",
      "c",
      "d",
    ])
  })

  it("keeps the opened entries when the list has none of them", () => {
    const opened = ["a", "b"]
    expect(appendLoadedEntryIds(opened, ["x", "y"])).toBe(opened)
  })
})

describe("shouldLoadMoreEntries", () => {
  const entryIds = Array.from({ length: 20 }, (_, index) => `entry-${index}`)

  it("waits while many loaded entries are left", () => {
    expect(shouldLoadMoreEntries(entryIds, "entry-0")).toBe(false)
    expect(shouldLoadMoreEntries(entryIds, "entry-13")).toBe(false)
  })

  it("loads more once a few loaded entries are left", () => {
    expect(shouldLoadMoreEntries(entryIds, "entry-14")).toBe(true)
    expect(shouldLoadMoreEntries(entryIds, "entry-19")).toBe(true)
  })

  it("does not load more for an entry the list does not have", () => {
    expect(shouldLoadMoreEntries(entryIds, "other")).toBe(false)
  })
})
