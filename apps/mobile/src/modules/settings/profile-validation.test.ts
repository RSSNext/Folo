import i18next from "i18next"
import { beforeAll, describe, expect, it } from "vitest"

import enCommon from "../../../../../locales/common/en.json"
import enSettings from "../../../../../locales/settings/en.json"
import { getProfileFieldError, getServerProfileFieldError } from "./profile-validation"

const INVALID_HANDLE = "Don't use spaces or invisible characters."

describe("getProfileFieldError", () => {
  beforeAll(async () => {
    await i18next.init({
      lng: "en",
      resources: { en: { common: enCommon, settings: enSettings } },
    })
  })

  it("accepts what the server's columns hold, counting characters as the server does", () => {
    expect(getProfileFieldError("name", "n".repeat(64))).toBeUndefined()
    expect(getProfileFieldError("name", "😀".repeat(64))).toBeUndefined()
    expect(getProfileFieldError("handle", "h".repeat(36))).toBeUndefined()
    expect(getProfileFieldError("bio", "b".repeat(256))).toBeUndefined()
    expect(
      getProfileFieldError("website", `https://example.com/${"a".repeat(236)}`),
    ).toBeUndefined()
    expect(getProfileFieldError("image", "i".repeat(256))).toBeUndefined()
  })

  it("refuses what the server would refuse, with the limit", () => {
    expect(getProfileFieldError("name", "n".repeat(65))).toBe("Use at most 64 characters.")
    expect(getProfileFieldError("handle", "h".repeat(37))).toBe("Use at most 36 characters.")
    expect(getProfileFieldError("bio", "😀".repeat(257))).toBe("Use at most 256 characters.")
    expect(getProfileFieldError("website", `https://example.com/${"a".repeat(237)}`)).toBe(
      "Use at most 256 characters.",
    )
    expect(getProfileFieldError("image", "i".repeat(257))).toBe("Use at most 256 characters.")
  })

  it("checks the name and handle trimmed, as they are saved", () => {
    expect(getProfileFieldError("name", "   ")).toBe("This field is required.")
    expect(getProfileFieldError("name", ` ${"n".repeat(64)} `)).toBeUndefined()
    expect(getProfileFieldError("handle", ` ${"h".repeat(36)} `)).toBeUndefined()
    // A blank handle saves as no handle
    expect(getProfileFieldError("handle", "  ", "folo")).toBeUndefined()
  })

  it("refuses a new handle with spaces or invisible characters, as the server does", () => {
    for (const handle of ["Ta ken", "Taken\u200B", "\u202ETaken", "fo\u3164lo", "fo\u2800lo"]) {
      expect(getProfileFieldError("handle", handle, "folo"), handle).toBe(INVALID_HANDLE)
      expect(getProfileFieldError("handle", handle, null), handle).toBe(INVALID_HANDLE)
    }
    // Other characters are the server's to accept
    expect(getProfileFieldError("handle", "fo.lo-2", "folo")).toBeUndefined()
    expect(getProfileFieldError("handle", "\u30D5\u30A9\u30ED", "folo")).toBeUndefined()
  })

  it("keeps a handle older clients saved without the check until the user changes it", () => {
    expect(getProfileFieldError("handle", "Ta ken", "Ta ken")).toBeUndefined()
    expect(getProfileFieldError("handle", "folo", " folo")).toBeUndefined()
    expect(getProfileFieldError("handle", "Ta ken2", "Ta ken")).toBe(INVALID_HANDLE)
  })
})

describe("getServerProfileFieldError", () => {
  it("puts the server's update-user codes on their fields", () => {
    expect(getServerProfileFieldError("HANDLE_ALREADY_TAKEN")).toEqual({
      field: "handle",
      message: "This handle is already taken.",
    })
    expect(getServerProfileFieldError("HANDLE_INVALID_CHARACTERS")).toEqual({
      field: "handle",
      message: INVALID_HANDLE,
    })
    expect(getServerProfileFieldError("NAME_CANNOT_BE_EMPTY")).toEqual({
      field: "name",
      message: "This field is required.",
    })
    expect(getServerProfileFieldError("NAME_TOO_LONG")).toEqual({
      field: "name",
      message: "Use at most 64 characters.",
    })
    expect(getServerProfileFieldError("HANDLE_TOO_LONG")).toEqual({
      field: "handle",
      message: "Use at most 36 characters.",
    })
    for (const [code, field] of [
      ["IMAGE_TOO_LONG", "image"],
      ["BIO_TOO_LONG", "bio"],
      ["WEBSITE_TOO_LONG", "website"],
    ] as const) {
      expect(getServerProfileFieldError(code)).toEqual({
        field,
        message: "Use at most 256 characters.",
      })
    }
  })

  it("leaves other errors to the generic message", () => {
    expect(getServerProfileFieldError("VALIDATION_ERROR")).toBeUndefined()
    expect(getServerProfileFieldError("toString")).toBeUndefined()
    expect(getServerProfileFieldError(undefined)).toBeUndefined()
  })
})
