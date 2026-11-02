import { trackApiConnection } from "@follow/utils/api-connection"
import { FollowAPIError, FollowClient, FollowTimeoutError } from "@follow-app/client-sdk"
import { describe, expect, it } from "vitest"

import { isConnectionFailure, isUnansweredRequestError } from "./network-error"

describe("isUnansweredRequestError", () => {
  it("counts requests that never got an answer", () => {
    expect(
      isUnansweredRequestError(
        new Error("fetch failed: java.net.ConnectException: Failed to connect to localhost"),
      ),
    ).toBe(true)
    expect(
      isUnansweredRequestError(
        new Error("fetch failed: The Internet connection appears to be offline."),
      ),
    ).toBe(true)
    expect(isUnansweredRequestError(new FollowTimeoutError())).toBe(true)
  })

  it("leaves out answers and cancelled requests", () => {
    expect(isUnansweredRequestError(new FollowAPIError("Not found", 404, "2001"))).toBe(false)
    expect(isUnansweredRequestError(new FollowAPIError("Service Unavailable", 503, "503"))).toBe(
      false,
    )
    expect(isUnansweredRequestError(new Error("fetch failed: The operation was aborted."))).toBe(
      false,
    )
    expect(isUnansweredRequestError("fetch failed: offline")).toBe(false)
    expect(isUnansweredRequestError(null)).toBe(false)
  })
})

describe("isConnectionFailure", () => {
  it("does not count a timeout, which the server may still be working on", () => {
    expect(isConnectionFailure(new FollowTimeoutError())).toBe(false)
  })
})

describe("a request the SDK gave up waiting for", () => {
  // expo/fetch rejects a request it aborted with an error of its own, not the standard AbortError
  const expoFetch = (_input: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        reject(new Error("fetch failed: java.io.IOException: Canceled"))
      })
    })

  it("fails as a timeout rather than as a lost connection", async () => {
    const client = new FollowClient({
      baseURL: "https://api.example.test",
      timeout: 10,
      fetch: expoFetch,
    })
    // The app's API client watches the connection like this; its error interceptor returns
    // nothing, which keeps the SDK's own handling of the errors
    trackApiConnection(client, { onUnreachable: () => {} })

    const error = await client.request("/status/configs").catch((error_: unknown) => error_)

    expect(error).toBeInstanceOf(FollowTimeoutError)
    expect(isUnansweredRequestError(error)).toBe(true)
    expect(isConnectionFailure(error)).toBe(false)
  })
})
