import type { Session } from "electron"
import { describe, expect, it, vi } from "vitest"

import {
  buildManagedAuthCookieHeader,
  buildManagedAuthCookieHeaderFromSetCookieHeader,
  getManagedAuthCookieNames,
  persistManagedAuthCookiesFromSetCookieHeader,
} from "./auth-cookies"

describe("auth cookies", () => {
  it("builds a cookie header from managed auth cookies only", () => {
    const header = buildManagedAuthCookieHeader([
      { name: "__Secure-better-auth.session_token", value: "session-token" },
      { name: "two_factor", value: "two-factor-token" },
      { name: "dont_remember", value: "true" },
      { name: "unrelated", value: "ignore-me" },
    ])

    expect(header).toBe(
      "__Secure-better-auth.session_token=session-token; two_factor=two-factor-token; dont_remember=true",
    )
  })

  it("includes the two-factor cookie in managed names", () => {
    expect(getManagedAuthCookieNames()).toContain("two_factor")
  })

  it("keeps prefixed two-factor cookies from a set-cookie header", () => {
    const header = buildManagedAuthCookieHeaderFromSetCookieHeader(
      [
        "__Secure-better-auth.two_factor=signed-two-factor; Path=/; HttpOnly; Secure; SameSite=Lax",
        "better-auth.last_used_login_method=email; Path=/; HttpOnly; Secure; SameSite=Lax",
      ].join(", "),
    )

    expect(header).toBe(
      "__Secure-better-auth.two_factor=signed-two-factor; better-auth.last_used_login_method=email",
    )
  })

  it("persists managed auth cookies and removes expired ones from a set-cookie header", async () => {
    const set = vi.fn().mockImplementation(async () => {})
    const remove = vi.fn().mockImplementation(async () => {})

    await persistManagedAuthCookiesFromSetCookieHeader({
      apiURL: "https://api.folo.is",
      session: {
        cookies: { set, remove },
      } as unknown as Session,
      setCookieHeader: [
        "two_factor=two-factor-token; Path=/; HttpOnly; Secure; SameSite=None",
        "__Secure-better-auth.session_token=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None",
      ].join(", "),
    })

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api.folo.is",
        name: "two_factor",
        value: "two-factor-token",
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "no_restriction",
      }),
    )
    expect(remove).toHaveBeenCalledWith("https://api.folo.is", "__Secure-better-auth.session_token")
  })
})
