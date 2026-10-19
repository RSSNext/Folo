import type { UseEntriesReturn } from "@follow/store/entry/types"
import { fallbackReturn } from "@follow/store/entry/utils"
import { describe, expect, it, vi } from "vitest"

import type { RemoteTimelineEntries } from "./timeline-entries"
import { joinRefreshAttempt, pickTimelineEntries } from "./timeline-entries"

const remoteRefetch = async () => {}
const reportingRefetch = async () => {}
const localRefetch = async () => {}

const remote = (overrides: Partial<UseEntriesReturn>): RemoteTimelineEntries => ({
  ...fallbackReturn,
  refetch: remoteRefetch,
  refetchReportingFailure: reportingRefetch,
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
    const shown = pickTimelineEntries(loaded, local(["stored"]))

    expect(shown.entriesIds).toEqual(["new", "stored"])
    expect(shown.isReady).toBe(true)
    // A refresh that fails leaves them on screen, so it says so
    expect(shown.refetch).toBe(reportingRefetch)
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
    expect(shown.refetch).toBe(reportingRefetch)
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
    expect(shown.refetch).toBe(reportingRefetch)
  })

  it("reports a failed first page without stored entries, so the empty list says why", () => {
    const error = new Error("fetch failed: offline")
    const shown = pickTimelineEntries(remote({ isLoading: false, error }), local([]))

    expect(shown.entriesIds).toEqual([])
    expect(shown.isReady).toBe(true)
    expect(shown.error).toBe(error)
    // The empty list shows the error, so a refresh does not toast it as well
    expect(shown.refetch).toBe(remoteRefetch)
  })

  it("shows placeholders while loading without stored entries", () => {
    const shown = pickTimelineEntries(remote({ isLoading: true, isFetching: true }), local([]))

    expect(shown.isReady).toBe(false)
    expect(shown.entriesIds).toEqual([])
    expect(shown.isFetching).toBe(true)
    expect(shown.refetch).toBe(remoteRefetch)
  })
})

describe("joinRefreshAttempt", () => {
  it("joins the refresh under way, so one failed request is told once", async () => {
    const attempt: { current: Promise<void> | null } = { current: null }
    let settle!: () => void
    const refresh = vi.fn(() => new Promise<void>((resolve) => (settle = resolve)))

    // Pulling again while the first page still loads, as the list shows no spinner meanwhile
    const first = joinRefreshAttempt(attempt, refresh)
    const second = joinRefreshAttempt(attempt, refresh)
    expect(second).toBe(first)
    expect(refresh).toHaveBeenCalledTimes(1)

    settle()
    await first
    // A pull after it settled refreshes again
    void joinRefreshAttempt(attempt, refresh)
    expect(refresh).toHaveBeenCalledTimes(2)
  })
})
