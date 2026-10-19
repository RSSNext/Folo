import {
  ExceptionCodeMap,
  FollowAPIError,
  FollowAuthError,
  FollowValidationError,
} from "@follow-app/client-sdk"
import enErrors from "@locales/errors/en.json"
import frErrors from "@locales/errors/fr-FR.json"
import jaErrors from "@locales/errors/ja.json"
import zhCNErrors from "@locales/errors/zh-CN.json"
import zhTWErrors from "@locales/errors/zh-TW.json"
import i18next from "i18next"
import { toast } from "sonner"
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest"

import { setApiUnreachable } from "~/atoms/api-connection"

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

  describe("with a request validation error", () => {
    beforeAll(async () => {
      await i18next.init({
        lng: "en",
        resources: { en: { errors: { 3: "Unprocessable content" } } },
      })
    })

    test("names the field the server rejected", () => {
      toastFetchError(new FollowAPIError("`rules.0.result.webhooks.0`: Invalid URL", 422, "3"))

      expect(toast.error).toHaveBeenCalledWith(
        "Unprocessable content",
        expect.objectContaining({ description: "`rules.0.result.webhooks.0`: Invalid URL" }),
      )
    })

    test("names the field under a title", () => {
      toastFetchError(new FollowAPIError("`rules.0.condition`: Invalid input", 422, "3"), {
        title: "Failed to save",
      })

      expect(toast.error).toHaveBeenCalledWith(
        "Failed to save",
        expect.objectContaining({ description: "`rules.0.condition`: Invalid input" }),
      )
    })
  })
})

describe("a request that got no answer", () => {
  const unreachable = "Unable to connect to the server."

  beforeAll(async () => {
    if (!i18next.isInitialized) await i18next.init({ lng: "en", resources: {} })
    i18next.addResourceBundle("en", "common", { "app.api_unreachable": unreachable }, true, true)
  })

  beforeEach(() => {
    vi.mocked(toast.error).mockClear()
  })

  test.each([
    ["Chromium", new TypeError("Failed to fetch")],
    ["Safari", new TypeError("Load failed")],
    ["Firefox", new TypeError("NetworkError when attempting to fetch resource.")],
    [
      "the main process",
      new Error("Error invoking remote method 'fetch': TypeError: fetch failed"),
    ],
  ])("says the server could not be reached instead of the wording of %s", (_, error) => {
    toastFetchError(error, { title: "Failed to unfollow" })

    expect(toast.error).toHaveBeenCalledWith(
      "Failed to unfollow",
      expect.objectContaining({ description: unreachable }),
    )
    expect(getFetchErrorMessage(error)).toBe(unreachable)
  })

  test("keeps the message of other failures", () => {
    const error = new TypeError("Failed to fetch dynamically imported module: /assets/a.js")

    expect(getFetchErrorMessage(error)).toBe(error.message)
  })

  test("adds nothing to the notice of an unreachable server, which says the same", () => {
    setApiUnreachable(true)
    try {
      toastFetchError(new TypeError("Failed to fetch"))
      expect(toast.error).not.toHaveBeenCalled()

      // A title still says which action failed
      toastFetchError(new TypeError("Failed to fetch"), { title: "Failed to unfollow" })
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to unfollow",
        expect.objectContaining({ description: unreachable }),
      )
    } finally {
      setApiUnreachable(false)
    }
  })

  test("says the server could not be reached before the notice shows", () => {
    toastFetchError(new TypeError("Failed to fetch"))

    expect(toast.error).toHaveBeenCalledWith(unreachable, expect.anything())
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

describe("an error the SDK names its own way", () => {
  const signIn = "Log in to complete this action."

  beforeAll(async () => {
    if (!i18next.isInitialized) await i18next.init({ lng: "en", resources: {} })
    i18next.addResourceBundle("en", "errors", { 3: "Unprocessable content", 1008: signIn }, true)
  })

  beforeEach(() => {
    vi.mocked(toast.error).mockClear()
  })

  test("is translated by the code of the server's answer", () => {
    // What the server answers a guest who tries to change something
    const guest = new FollowAuthError(
      "Cannot complete this operation without login, please log in first.",
      undefined,
      { serverCode: 1008 },
    )

    expect(getFetchErrorMessage(guest)).toBe(signIn)
    toastFetchError(guest)
    expect(toast.error).toHaveBeenCalledWith(signIn, expect.anything())
  })

  test("still names the field a refused request body got wrong", () => {
    toastFetchError(
      new FollowValidationError("`url`: Invalid URL", [{ path: ["url"] }], { serverCode: 3 }),
    )

    expect(toast.error).toHaveBeenCalledWith(
      "Unprocessable content",
      expect.objectContaining({ description: "`url`: Invalid URL" }),
    )
  })
})

describe("error code translations", () => {
  test("cover every code the server answers with in every language", () => {
    const codes = Object.values(ExceptionCodeMap)
      .filter((code) => typeof code === "number")
      .map(String)
    const errorsByLanguage = {
      en: enErrors,
      "zh-CN": zhCNErrors,
      "zh-TW": zhTWErrors,
      ja: jaErrors,
      "fr-FR": frErrors,
    }

    for (const [language, errors] of Object.entries(errorsByLanguage)) {
      expect(
        codes.filter((code) => !Object.hasOwn(errors, code)),
        language,
      ).toEqual([])
    }
  })
})
