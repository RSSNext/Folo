import { describe, expect, it } from "vitest"

import { isValidEmail } from "./email"

describe("isValidEmail", () => {
  it("accepts an ordinary address", () => {
    expect(isValidEmail("someone@example.com")).toBe(true)
    expect(isValidEmail("first.last+tag@mail.example.co")).toBe(true)
  })

  it("rejects addresses the auth server rejects", () => {
    expect(isValidEmail("")).toBe(false)
    expect(isValidEmail("abc")).toBe(false)
    expect(isValidEmail("abc@")).toBe(false)
    expect(isValidEmail("abc@x")).toBe(false)
    expect(isValidEmail("a b@example.com")).toBe(false)
  })
})
