import {
  FollowAPIError,
  FollowAuthError,
  FollowTimeoutError,
  FollowValidationError,
} from "@follow-app/client-sdk"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getFetchErrorMessage, isNotFoundError, toastFetchError } from "./error-parser"

const mocks = vi.hoisted(() => ({
  isPaymentEnabled: false,
  showUpgradeRequiredDialog: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock("i18next", () => ({
  t: (key: string) => {
    if (key === "errors:2012") {
      return "RSSHub feed subscription limit exceeded"
    }
    if (key === "errors:3") {
      return "Unprocessable content"
    }
    if (key === "errors:1008") {
      return "Log in to complete this action."
    }
    return key.replace(/^errors:/u, "")
  },
}))

vi.mock("@/src/atoms/server-configs", () => ({
  getIsPaymentEnabled: () => mocks.isPaymentEnabled,
}))

vi.mock("@/src/modules/dialogs/UpgradeRequiredDialog", () => ({
  showUpgradeRequiredDialog: mocks.showUpgradeRequiredDialog,
}))

vi.mock("./toast", () => ({
  toast: {
    error: mocks.toastError,
  },
}))

describe("toastFetchError", () => {
  beforeEach(() => {
    mocks.isPaymentEnabled = false
    mocks.showUpgradeRequiredDialog.mockClear()
    mocks.toastError.mockClear()
  })

  it("shows a concise upgrade dialog for RSSHub subscription limits", () => {
    mocks.isPaymentEnabled = true
    const error = new FollowAPIError("RSSHub feed subscription limit exceeded", 402, "2012")

    toastFetchError(error)

    expect(mocks.showUpgradeRequiredDialog).toHaveBeenCalledWith({
      title: "RSSHub feed subscription limit exceeded",
      message: "settings:subscription.summary.free_description",
    })
    expect(mocks.toastError).not.toHaveBeenCalled()
  })

  it("shows the server's message when an API error code has no translation", () => {
    const error = new FollowAPIError("Unable to follow this feed", 400, "29999")

    toastFetchError(error)

    expect(mocks.toastError).toHaveBeenCalledOnce()
    expect(mocks.toastError).toHaveBeenCalledWith("Unable to follow this feed")
  })
})

describe("toastFetchError for a rejected request body", () => {
  beforeEach(() => {
    mocks.toastError.mockClear()
  })

  it("names the field the server rejected under the translated code", () => {
    toastFetchError(new FollowAPIError("`rules.0.result.webhooks.0`: Invalid URL", 422, "3"))

    expect(mocks.toastError).toHaveBeenCalledWith("Unprocessable content", {
      description: "`rules.0.result.webhooks.0`: Invalid URL",
    })
  })

  it("names the field under a title", () => {
    toastFetchError(new FollowAPIError("`rules.0.condition`: Invalid input", 422, "3"), {
      title: "Failed to save",
    })

    expect(mocks.toastError).toHaveBeenCalledWith("Failed to save", {
      description: "`rules.0.condition`: Invalid input",
    })
  })
})

describe("toastFetchError under a title", () => {
  beforeEach(() => {
    mocks.toastError.mockClear()
  })

  it("says what the server answered below the title", () => {
    toastFetchError(new FollowAPIError("Entry not found", 404, "4000"), {
      title: "A change couldn't be saved and was undone",
    })

    expect(mocks.toastError).toHaveBeenCalledWith("A change couldn't be saved and was undone", {
      description: "Entry not found",
    })
  })

  it("says the server could not be reached below the title", () => {
    toastFetchError(new Error("fetch failed: java.net.ConnectException: Failed to connect"), {
      title: "Failed to save",
    })

    expect(mocks.toastError).toHaveBeenCalledWith("Failed to save", {
      description: "common:app.api_unreachable",
    })
  })

  it("does not repeat a title the answer says again", () => {
    toastFetchError(new FollowAPIError("Failed to save", 500, "9999"), { title: "Failed to save" })

    expect(mocks.toastError).toHaveBeenCalledWith("Failed to save")
  })
})

describe("getFetchErrorMessage", () => {
  it("describes a request that never reached the server instead of the native reason", () => {
    const error = new Error(
      "fetch failed: java.net.ConnectException: Failed to connect to localhost/127.0.0.1:3000",
    )

    expect(getFetchErrorMessage(error)).toBe("common:app.api_unreachable")
  })

  it("says the server took too long instead of blaming the network", () => {
    expect(getFetchErrorMessage(new FollowTimeoutError())).toBe("common:app.request_timeout")

    mocks.toastError.mockClear()
    toastFetchError(new FollowTimeoutError())
    expect(mocks.toastError).toHaveBeenCalledWith("common:app.request_timeout")
  })

  it("keeps the message of a cancelled request", () => {
    const error = new Error("fetch failed: The operation was aborted.")

    expect(getFetchErrorMessage(error)).toBe("fetch failed: The operation was aborted.")
  })
})

describe("toastFetchError for a refused session", () => {
  it("asks to sign in, translated, instead of the server's Unauthorized", () => {
    mocks.toastError.mockClear()
    toastFetchError(
      new FollowAuthError("Unauthorized", {
        code: 1000,
        message: "Unauthorized",
      }),
    )

    expect(mocks.toastError).toHaveBeenCalledWith("Log in to complete this action.")
  })
})

describe("an error the SDK names its own way", () => {
  beforeEach(() => {
    mocks.toastError.mockClear()
  })

  it("asks a guest to sign in, by the code of the server's answer", () => {
    const guest = new FollowAuthError(
      "Cannot complete this operation without login, please log in first.",
      undefined,
      { serverCode: 1008 },
    )

    expect(getFetchErrorMessage(guest)).toBe("Log in to complete this action.")
  })

  it("translates a refused session the server gave another code by that code", () => {
    const refused = new FollowAuthError("limit", undefined, { serverCode: 2012 })

    expect(getFetchErrorMessage(refused)).toBe("RSSHub feed subscription limit exceeded")
  })

  it("names the field a refused request body got wrong under the translated code", () => {
    toastFetchError(
      new FollowValidationError("`url`: Invalid URL", [{ path: ["url"] }], { serverCode: 3 }),
    )

    expect(mocks.toastError).toHaveBeenCalledWith("Unprocessable content", {
      description: "`url`: Invalid URL",
    })
  })
})

describe("toastFetchError for unreachable servers", () => {
  it("shows the connection message instead of the native reason", () => {
    mocks.toastError.mockClear()
    toastFetchError(
      new Error("fetch failed: java.net.UnknownHostException: Unable to resolve host"),
    )

    expect(mocks.toastError).toHaveBeenCalledWith("common:app.api_unreachable")
  })
})

describe("getFetchErrorMessage for API errors", () => {
  it("keeps the API message for a code without a translation", () => {
    const error = new FollowAPIError("Something specific went wrong", 400, "9999")
    expect(getFetchErrorMessage(error)).toBe("Something specific went wrong")
  })

  it("keeps the SDK message for a non-numeric code", () => {
    const error = new FollowAPIError("Validation error", 400, "VALIDATION_ERROR")
    expect(getFetchErrorMessage(error)).toBe("Validation error")
  })

  it("asks to sign in for a refused session instead of the bare status", () => {
    const error = new FollowAuthError("Unauthorized")
    expect(getFetchErrorMessage(error)).toBe("Log in to complete this action.")
  })

  it("translates a known API error code", () => {
    const error = new FollowAPIError("limit", 402, "2012")
    expect(getFetchErrorMessage(error)).toBe("RSSHub feed subscription limit exceeded")
  })
})

describe("isNotFoundError", () => {
  it("tells what the server says does not exist from what may load later", () => {
    expect(isNotFoundError(new FollowAPIError("Feed not found", 404, "2001"))).toBe(true)
    expect(isNotFoundError(new FollowAPIError("List not found", 404, "8000"))).toBe(true)
    expect(isNotFoundError(new FollowAPIError("Service Unavailable", 503, "503"))).toBe(false)
    expect(isNotFoundError(new Error("fetch failed: offline"))).toBe(false)
  })
})
