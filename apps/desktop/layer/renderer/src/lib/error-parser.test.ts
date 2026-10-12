import { FollowAPIError } from "@follow-app/client-sdk"
import { toast } from "sonner"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { getFetchErrorMessage, toastFetchError } from "./error-parser"

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}))

describe("toastFetchError", () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockClear()
  })

  test("shows the message of a plain error", () => {
    toastFetchError(new Error("Handle is already taken"))

    expect(toast.error).toHaveBeenCalledWith("Handle is already taken", expect.anything())
  })

  test("shows the message of a plain error under a title", () => {
    toastFetchError(new Error("No content available for TTS"), { title: "Failed to read aloud" })

    expect(toast.error).toHaveBeenCalledWith(
      "Failed to read aloud",
      expect.objectContaining({ description: "No content available for TTS" }),
    )
  })
})

describe("getFetchErrorMessage", () => {
  test("keeps the API message for a code without a translation", () => {
    expect(getFetchErrorMessage(new FollowAPIError("Something specific", 400, "9999"))).toBe(
      "Something specific",
    )
  })

  test("keeps the SDK message for a non-numeric code", () => {
    expect(
      getFetchErrorMessage(new FollowAPIError("Authentication required", 401, "AUTH_REQUIRED")),
    ).toBe("Authentication required")
  })
})
