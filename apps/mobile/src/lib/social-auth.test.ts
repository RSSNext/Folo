import { describe, expect, it } from "vitest"

import { buildAuthorizationProxyURL, parseSocialAuthCallbackURL } from "./social-auth"

describe("parseSocialAuthCallbackURL", () => {
  it("returns the session cookie of a successful callback", () => {
    const cookie = "__Secure-better-auth.session_token=token; Max-Age=2592000; Path=/"

    expect(parseSocialAuthCallbackURL(`folo://?cookie=${encodeURIComponent(cookie)}#`)).toEqual({
      result: { type: "success" },
      cookie,
    })
  })

  it("reports a rejected callback and ignores its cookies", () => {
    expect(
      parseSocialAuthCallbackURL(
        "folo://?error=state_mismatch&cookie=__Secure-better-auth.state%3D%3B%20Max-Age%3D0",
      ),
    ).toEqual({ result: { type: "error", error: "state_mismatch" }, cookie: null })
  })

  it("treats a denied consent screen as a cancellation", () => {
    expect(parseSocialAuthCallbackURL("folo://?error=access_denied").result).toEqual({
      type: "cancel",
    })
  })

  it("reports a callback without a session cookie", () => {
    expect(parseSocialAuthCallbackURL("folo://").result).toEqual({
      type: "error",
      error: "missing_session_cookie",
    })
  })
})

describe("buildAuthorizationProxyURL", () => {
  const authBaseURL = "https://api.folo.is/better-auth"
  const authorizationURL = "https://accounts.google.com/o/oauth2/v2/auth?state=abc&scope=email"

  it("points the Expo authorization proxy at the provider URL", () => {
    const url = new URL(
      buildAuthorizationProxyURL({ authBaseURL, authorizationURL, storedCookie: "{}" }),
    )

    expect(`${url.origin}${url.pathname}`).toBe(`${authBaseURL}/expo-authorization-proxy`)
    expect(url.searchParams.get("authorizationURL")).toBe(authorizationURL)
    expect(url.searchParams.has("oauthState")).toBe(false)
  })

  it("forwards cookie-based OAuth state to the proxy", () => {
    const storedCookie = JSON.stringify({
      "__Secure-better-auth.oauth_state": { value: "encrypted-state", expires: null },
    })

    const url = new URL(buildAuthorizationProxyURL({ authBaseURL, authorizationURL, storedCookie }))

    expect(url.searchParams.get("oauthState")).toBe("encrypted-state")
  })

  it("ignores unreadable cookie storage", () => {
    const url = new URL(
      buildAuthorizationProxyURL({ authBaseURL, authorizationURL, storedCookie: "not json" }),
    )

    expect(url.searchParams.has("oauthState")).toBe(false)
  })
})
