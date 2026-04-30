import type { Session } from "electron"
import { describe, expect, it, vi } from "vitest"

import {
  buildManagedAuthCookieHeader,
  buildManagedAuthCookieHeaderFromSetCookieHeader,
  dedupeManagedAuthCookies,
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

  it("deduplicates session token cookies when building a cookie header", () => {
    const header = buildManagedAuthCookieHeader([
      {
        name: "better-auth.session_token",
        value: "legacy-token",
        domain: ".api.folo.is",
        hostOnly: false,
        path: "/",
        secure: true,
      },
      {
        name: "__Secure-better-auth.session_token",
        value: "domain-token",
        domain: ".api.folo.is",
        hostOnly: false,
        path: "/",
        secure: true,
      },
      {
        name: "__Secure-better-auth.session_token",
        value: "host-token.signature",
        domain: "api.folo.is",
        hostOnly: true,
        path: "/",
        secure: true,
      },
      { name: "two_factor", value: "two-factor-token" },
    ])

    expect(header).toBe(
      "__Secure-better-auth.session_token=host-token.signature; two_factor=two-factor-token",
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
    const get = vi.fn().mockResolvedValue([])

    await persistManagedAuthCookiesFromSetCookieHeader({
      apiURL: "https://api.folo.is",
      session: {
        cookies: { get, set, remove },
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
    expect(remove).not.toHaveBeenCalled()
  })

  it("removes stale duplicate session token cookies while keeping the secure host-only cookie", async () => {
    const remove = vi.fn().mockImplementation(async () => {})
    const get = vi.fn().mockResolvedValue([
      {
        name: "better-auth.session_token",
        value: "legacy-token",
        domain: ".api.folo.is",
        hostOnly: false,
        path: "/",
        secure: true,
        sameSite: "no_restriction",
      },
      {
        name: "__Secure-better-auth.session_token",
        value: "domain-token",
        domain: ".api.folo.is",
        hostOnly: false,
        path: "/",
        secure: true,
        sameSite: "no_restriction",
      },
      {
        name: "__Secure-better-auth.session_token",
        value: "host-token.signature",
        domain: "api.folo.is",
        hostOnly: true,
        path: "/",
        secure: true,
        sameSite: "no_restriction",
      },
    ])

    await dedupeManagedAuthCookies({
      apiURL: "https://api.folo.is",
      session: {
        cookies: { get, remove },
      } as unknown as Session,
    })

    expect(remove).toHaveBeenCalledWith(
      "https://__folo_cookie_cleanup__.api.folo.is/",
      "better-auth.session_token",
    )
    expect(remove).toHaveBeenCalledWith(
      "https://__folo_cookie_cleanup__.api.folo.is/",
      "__Secure-better-auth.session_token",
    )
    expect(remove).toHaveBeenCalledTimes(2)
  })
})
