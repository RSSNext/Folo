import { ExceptionCodeMap, FollowAPIError } from "@follow-app/client-sdk"
import enErrors from "@locales/errors/en.json"
import frErrors from "@locales/errors/fr-FR.json"
import jaErrors from "@locales/errors/ja.json"
import zhCNErrors from "@locales/errors/zh-CN.json"
import zhTWErrors from "@locales/errors/zh-TW.json"
import i18next from "i18next"
import { toast } from "sonner"
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest"

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
      toastFetchError(
        new FollowAPIError(
          "`rules.0.result.webhooks.0`: Invalid URL\nRequest: PUT /actions (original: /actions)\nArgs: {}",
          422,
          "3",
        ),
      )

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

describe("getFetchErrorMessage", () => {
  test("keeps the API message for a code without a translation", () => {
    expect(getFetchErrorMessage(new FollowAPIError("Something specific", 400, "9999"))).toBe(
      "Something specific",
    )
  })

  test("drops the request context the SDK appends", () => {
    expect(
      getFetchErrorMessage(
        new FollowAPIError(
          'Internal Server Error\nRequest: POST /subscriptions/parse-opml (original: /subscriptions/parse-opml)\nArgs: {"headers":{"x-session-id":"abc"}}',
          500,
        ),
      ),
    ).toBe("Internal Server Error")
  })

  test("keeps the SDK message for a non-numeric code", () => {
    expect(
      getFetchErrorMessage(new FollowAPIError("Authentication required", 401, "AUTH_REQUIRED")),
    ).toBe("Authentication required")
  })
})

describe("error code translations", () => {
  // Codes newer servers answer with that the SDK's ExceptionCodeMap does not name yet
  const codesMissingFromSDK = [8005, 12001, 13008, 15006]

  test("cover every code the server answers with in every language", () => {
    const codes = [
      ...Object.values(ExceptionCodeMap).filter((code) => typeof code === "number"),
      ...codesMissingFromSDK,
    ].map(String)
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
