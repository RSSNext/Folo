import enCommon from "@locales/common/en.json"
import enSettings from "@locales/settings/en.json"
import i18next from "i18next"
import { beforeAll, describe, expect, test } from "vitest"

import { createProfileFormSchema, getProfileFieldError } from "./profile-form-schema"

const profile = { handle: "folo", name: "Folo", image: "", bio: "", website: "" }

const errorOf = (values: Partial<typeof profile>, storedHandle: string | null = profile.handle) => {
  const result = createProfileFormSchema(storedHandle).safeParse({ ...profile, ...values })
  return result.success ? undefined : result.error.issues[0]!.message
}

describe("createProfileFormSchema", () => {
  beforeAll(async () => {
    await i18next.init({
      lng: "en",
      resources: { en: { common: enCommon, settings: enSettings } },
    })
  })

  test("accepts what the server's columns hold", () => {
    expect(errorOf({ name: "n".repeat(64) })).toBeUndefined()
    expect(errorOf({ handle: "h".repeat(36) })).toBeUndefined()
    expect(errorOf({ website: `https://example.com/${"a".repeat(200)}` })).toBeUndefined()
    // The server counts an emoji as one character
    expect(errorOf({ name: "😀".repeat(64) })).toBeUndefined()
  })

  test("refuses what the server would refuse, with the limit", () => {
    expect(errorOf({ name: "n".repeat(65) })).toBe("Use at most 64 characters.")
    expect(errorOf({ handle: "h".repeat(37) })).toBe("Use at most 36 characters.")
    expect(errorOf({ bio: "b".repeat(257) })).toBe("Use at most 256 characters.")
    expect(errorOf({ website: `https://example.com/${"a".repeat(240)}` })).toBe(
      "Use at most 256 characters.",
    )
  })

  test("refuses a handle with spaces or invisible characters, as the server does", () => {
    for (const handle of ["Ta ken", "Taken\u200B", "\u202ETaken"]) {
      expect(errorOf({ handle }), handle).toBe("Use only letters, numbers and underscores.")
      expect(errorOf({ handle }, null), handle).toBe("Use only letters, numbers and underscores.")
    }
  })

  test("keeps a handle older clients saved without the check until the user changes it", () => {
    // The server keeps a stored handle that a save sends back, so other fields stay editable
    for (const handle of ["Ta ken", "\u30D5\u30A9\u30ED", "folo "]) {
      expect(errorOf({ handle, name: "New" }, handle), handle).toBeUndefined()
    }

    expect(errorOf({ handle: "Ta ken2" }, "Ta ken")).toBe(
      "Use only letters, numbers and underscores.",
    )
    expect(errorOf({ handle: "\u30D5\u30A9" }, "\u30D5\u30A9\u30ED")).toBe(
      "Use only letters, numbers and underscores.",
    )
    expect(errorOf({ handle: "folo_2" }, "Ta ken")).toBeUndefined()
  })
})

describe("getProfileFieldError", () => {
  test("puts the server's update-user codes on their fields", () => {
    expect(getProfileFieldError("HANDLE_ALREADY_TAKEN")).toEqual({
      field: "handle",
      message: "This handle is already taken.",
    })
    expect(getProfileFieldError("NAME_CANNOT_BE_EMPTY")).toEqual({
      field: "name",
      message: "This field is required.",
    })
    expect(getProfileFieldError("WEBSITE_TOO_LONG")).toEqual({
      field: "website",
      message: "Use at most 256 characters.",
    })
    expect(getProfileFieldError("HANDLE_INVALID_CHARACTERS")).toEqual({
      field: "handle",
      message: "Use only letters, numbers and underscores.",
    })
  })

  test("leaves other errors to the generic message", () => {
    expect(getProfileFieldError("VALIDATION_ERROR")).toBeUndefined()
    expect(getProfileFieldError("toString")).toBeUndefined()
    expect(getProfileFieldError(undefined)).toBeUndefined()
  })
})
