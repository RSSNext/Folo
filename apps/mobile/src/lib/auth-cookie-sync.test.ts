import { describe, expect, it } from "vitest"

import { extractSetCookieHeaderValues, mergeStoredAuthCookies } from "./auth-cookie-sync"

describe("mobile auth cookie sync", () => {
  it("keeps the two-factor cookie from a React Native style combined Set-Cookie header", () => {
    const previousCookie = JSON.stringify({
      "better-auth.session_token": {
        value: "old-session",
        expires: null,
      },
    })
    const combinedSetCookie = [
      "better-auth.session_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax",
      "better-auth.session_data=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax",
      "better-auth.two_factor=signed-two-factor; Max-Age=600; Path=/; HttpOnly; SameSite=Lax",
      "better-auth.last_used_login_method=email; Max-Age=2592000; Path=/; HttpOnly; SameSite=Lax",
    ].join(", ")

    const storedCookie = mergeStoredAuthCookies([combinedSetCookie], previousCookie)
    const parsed = JSON.parse(storedCookie)

    expect(parsed["better-auth.session_token"]).toBeUndefined()
    expect(parsed["better-auth.session_data"]).toBeUndefined()
    expect(parsed["better-auth.two_factor"]?.value).toBe("signed-two-factor")
    expect(parsed["better-auth.last_used_login_method"]?.value).toBe("email")
  })

  it("reads Set-Cookie values from standard and React Native header shapes", () => {
    const headers = new Headers({
      "set-cookie": "better-auth.two_factor=signed-two-factor; Path=/; HttpOnly",
    }) as Headers & {
      _headers?: Record<string, string[]>
    }
    headers._headers = {
      "set-cookie": ["better-auth.last_used_login_method=email; Path=/; HttpOnly"],
    }

    expect(extractSetCookieHeaderValues(headers)).toEqual([
      "better-auth.two_factor=signed-two-factor; Path=/; HttpOnly",
      "better-auth.last_used_login_method=email; Path=/; HttpOnly",
    ])
  })

  it("ignores unrelated cookies", () => {
    const storedCookie = mergeStoredAuthCookies(
      ["analytics_id=third-party; Max-Age=60; Path=/"],
      "{}",
    )

    expect(storedCookie).toBe("{}")
  })
})
