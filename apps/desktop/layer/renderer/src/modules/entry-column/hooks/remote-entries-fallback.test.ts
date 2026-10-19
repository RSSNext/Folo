import { describe, expect, it, vi } from "vitest"

import { getRemoteEntriesFallback } from "./remote-entries-fallback"

const query = {
  isError: false,
  isFetching: false,
  error: null,
  fetchStatus: "idle" as const,
}

describe("getRemoteEntriesFallback", () => {
  it("is offline, not loading, while the first page waits for the network", () => {
    const refetch = vi.fn(async () => {})

    const result = getRemoteEntriesFallback({ ...query, fetchStatus: "paused" }, refetch)

    expect(result).toMatchObject({ isLoading: false, isOffline: true, entriesIds: [] })
    expect(result.refetch).toBe(refetch)
  })

  it("is loading while the first page is on its way", () => {
    const result = getRemoteEntriesFallback({ ...query, fetchStatus: "fetching" }, vi.fn())

    expect(result.isLoading).toBe(true)
    expect(result.isOffline).toBeUndefined()
  })

  it("reports a failed first page with its error", () => {
    const error = new Error("boom")

    const result = getRemoteEntriesFallback({ ...query, isError: true, error }, vi.fn())

    expect(result).toMatchObject({ isLoading: false, error })
    expect(result.isOffline).toBeUndefined()
  })
})
