import { FollowAPIError, FollowTimeoutError } from "@follow-app/client-sdk"
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
