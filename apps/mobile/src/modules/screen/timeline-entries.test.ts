import type { UseEntriesReturn } from "@follow/store/entry/types"
import { fallbackReturn } from "@follow/store/entry/utils"
import { describe, expect, it } from "vitest"

import { pickTimelineEntries } from "./timeline-entries"

const remoteRefetch = async () => {}
const localRefetch = async () => {}

const remote = (overrides: Partial<UseEntriesReturn>): UseEntriesReturn => ({
  ...fallbackReturn,
  refetch: remoteRefetch,
  ...overrides,
})

const local = (entriesIds: string[]): UseEntriesReturn => ({
  ...fallbackReturn,
  entriesIds,
  refetch: localRefetch,
  isLoading: false,
  isReady: true,
})

describe("pickTimelineEntries", () => {
  it("shows the server's entries once its first page is in", () => {
    const loaded = remote({ entriesIds: ["new", "stored"], isReady: true, isLoading: false })
    expect(pickTimelineEntries(loaded, local(["stored"]))).toBe(loaded)
  })

  it("shows the stored entries while the first page loads", () => {
    const shown = pickTimelineEntries(
      remote({ isLoading: true, isFetching: true }),
      local(["stored"]),
    )

    expect(shown.entriesIds).toEqual(["stored"])
    expect(shown.isReady).toBe(true)
    expect(shown.isFetching).toBe(true)
    expect(shown.error).toBeNull()
    expect(shown.refetch).toBe(remoteRefetch)
  })

  it("keeps the stored entries when a refresh after a failure starts over", () => {
    // The query drops the error of a page that never loaded when it is fetched again
    const shown = pickTimelineEntries(
      remote({ isLoading: true, isFetching: true, error: null }),
      local(["stored"]),
    )

    expect(shown.entriesIds).toEqual(["stored"])
    expect(shown.isReady).toBe(true)
  })

  it("shows the stored entries and the error when the first page failed", () => {
    const error = new Error("fetch failed: offline")
    const shown = pickTimelineEntries(remote({ isLoading: false, error }), local(["stored"]))

    expect(shown.entriesIds).toEqual(["stored"])
    expect(shown.error).toBe(error)
    expect(shown.refetch).toBe(remoteRefetch)
  })

  it("reports a failed first page without stored entries, so the empty list says why", () => {
    const error = new Error("fetch failed: offline")
    const shown = pickTimelineEntries(remote({ isLoading: false, error }), local([]))

    expect(shown.entriesIds).toEqual([])
    expect(shown.isReady).toBe(true)
    expect(shown.error).toBe(error)
  })

  it("shows placeholders while loading without stored entries", () => {
    const shown = pickTimelineEntries(remote({ isLoading: true, isFetching: true }), local([]))

    expect(shown.isReady).toBe(false)
    expect(shown.entriesIds).toEqual([])
    expect(shown.isFetching).toBe(true)
    expect(shown.refetch).toBe(remoteRefetch)
  })
})
