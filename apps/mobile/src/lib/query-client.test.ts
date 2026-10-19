import { FollowAPIError, FollowTimeoutError } from "@follow-app/client-sdk"
import { QueryObserver } from "@tanstack/react-query"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("./kv", () => ({
  kv: { getSync: vi.fn(), setSync: vi.fn(), delete: vi.fn() },
}))

const { queryClient, refetchUnansweredQueries } = await import("./query-client")

const observe = (key: string, queryFn: () => Promise<string>, enabled = true) => {
  const observer = new QueryObserver(queryClient, {
    queryKey: [key],
    queryFn,
    retry: false,
    enabled,
  })
  return observer.subscribe(() => {})
}

describe("refetchUnansweredQueries", () => {
  afterEach(() => {
    queryClient.clear()
  })

  it("fetches again what is on screen and failed for want of an answer", async () => {
    const offline = vi.fn(async (): Promise<string> => {
      throw new Error("fetch failed: java.net.ConnectException: Failed to connect")
    })
    const notFound = vi.fn(async (): Promise<string> => {
      throw new FollowAPIError("Entry not found", 404, "3000")
    })
    const unsubscribers = [observe("offline", offline), observe("not-found", notFound)]
    await vi.waitFor(() => {
      expect(queryClient.getQueryState(["offline"])?.status).toBe("error")
      expect(queryClient.getQueryState(["not-found"])?.status).toBe("error")
    })

    await refetchUnansweredQueries()

    expect(offline).toHaveBeenCalledTimes(2)
    // The server would answer the same way again
    expect(notFound).toHaveBeenCalledTimes(1)
    for (const unsubscribe of unsubscribers) unsubscribe()
  })

  it("leaves failed queries nothing shows", async () => {
    const offline = vi.fn(async (): Promise<string> => {
      throw new Error("fetch failed: offline")
    })
    const unsubscribe = observe("hidden", offline)
    await vi.waitFor(() => expect(queryClient.getQueryState(["hidden"])?.status).toBe("error"))
    unsubscribe()

    await refetchUnansweredQueries()

    expect(offline).toHaveBeenCalledTimes(1)
  })
})

describe("query retries", () => {
  const retry = queryClient.getDefaultOptions().queries?.retry as (
    failureCount: number,
    error: Error,
  ) => boolean

  it("does not retry a timeout, which would make the wait a multiple", () => {
    expect(retry(0, new FollowTimeoutError())).toBe(false)
  })

  it("retries a failed connection a few times", () => {
    const error = new Error("fetch failed: java.net.ConnectException: Failed to connect")
    expect(retry(0, error)).toBe(true)
    expect(retry(2, error)).toBe(true)
    expect(retry(3, error)).toBe(false)
  })
})
