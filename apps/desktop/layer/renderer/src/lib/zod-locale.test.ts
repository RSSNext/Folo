import enCommon from "@locales/common/en.json"
import i18next from "i18next"
import { beforeAll, describe, expect, test } from "vitest"
import { z } from "zod"

import { applyZodLocale } from "./zod-locale"

const firstMessage = (schema: z.ZodType, value: unknown) => {
  const result = schema.safeParse(value)
  if (result.success) throw new Error("expected the value to be rejected")
  return result.error.issues[0]!.message
}

describe("applyZodLocale", () => {
  beforeAll(async () => {
    await i18next.init({ lng: "en", resources: { en: { common: enCommon } } })
    applyZodLocale("en")
  })

  test("asks for a value an empty field needs", () => {
    expect(firstMessage(z.string().min(1), "")).toBe("This field is required.")
  })

  test("names the length limits of a text", () => {
    expect(firstMessage(z.string().min(8), "short")).toBe("Use at least 8 characters.")
    expect(firstMessage(z.string().max(32), "x".repeat(33))).toBe("Use at most 32 characters.")
    expect(firstMessage(z.string().length(6), "123")).toBe("Enter exactly 6 characters.")
  })

  test("explains an invalid email address or URL", () => {
    expect(firstMessage(z.string().email(), "not-an-email")).toBe("Enter a valid email address.")
    expect(firstMessage(z.string().url(), "not a url")).toBe("Enter a valid URL.")
  })

  test("keeps a message the schema sets itself", () => {
    expect(firstMessage(z.string().min(1, { error: "Enter a title." }), "")).toBe("Enter a title.")
  })

  test("leaves other checks to zod's translated messages", () => {
    expect(firstMessage(z.number().min(3), 1)).toContain("3")
  })
})
