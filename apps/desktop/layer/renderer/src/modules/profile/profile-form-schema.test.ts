import enCommon from "@locales/common/en.json"
import enSettings from "@locales/settings/en.json"
import i18next from "i18next"
import { beforeAll, describe, expect, test } from "vitest"

import { getProfileFieldError, profileFormSchema } from "./profile-form-schema"

const profile = { handle: "folo", name: "Folo", image: "", bio: "", website: "" }

const errorOf = (values: Partial<typeof profile>) => {
  const result = profileFormSchema.safeParse({ ...profile, ...values })
  return result.success ? undefined : result.error.issues[0]!.message
}

describe("profileFormSchema", () => {
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
  })

  test("leaves other errors to the generic message", () => {
    expect(getProfileFieldError("VALIDATION_ERROR")).toBeUndefined()
    expect(getProfileFieldError("toString")).toBeUndefined()
    expect(getProfileFieldError(undefined)).toBeUndefined()
  })
})
