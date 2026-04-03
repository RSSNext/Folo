import { describe, expect, it } from "vitest"

import { resolveCliSessionToken } from "./cli-login-token"

describe("resolveCliSessionToken", () => {
  it("prefers the desktop session cookie token", () => {
    expect(
      resolveCliSessionToken({
        preferredToken: "one-time-token",
        cookieToken: "session-token",
      }),
    ).toBe("session-token")
  })

  it("falls back to the preferred token when no cookie token exists", () => {
    expect(
      resolveCliSessionToken({
        preferredToken: "session-token",
      }),
    ).toBe("session-token")
  })

  it("returns undefined when neither token is available", () => {
    expect(resolveCliSessionToken({})).toBeUndefined()
  })
})
