import { describe, expect, it } from "vitest"

import { DEFAULT_VALUES } from "../../../packages/internal/shared/src/env.common"
import { resolveCLILoginUrl } from "./browser-login"

describe("browser login helpers", () => {
  it("maps production API URL using env.common", () => {
    const url = resolveCLILoginUrl(DEFAULT_VALUES.PROD.API_URL, "http://127.0.0.1:12345/callback")
    const parsed = new URL(url)

    expect(parsed.origin).toBe(new URL(DEFAULT_VALUES.PROD.WEB_URL).origin)
    expect(parsed.pathname).toBe("/login")
    expect(parsed.searchParams.get("cli_callback")).toBe("http://127.0.0.1:12345/callback")
  })

  it("maps dev API URL using env.common", () => {
    const url = resolveCLILoginUrl(DEFAULT_VALUES.DEV.API_URL, "http://127.0.0.1:12345/callback")
    const parsed = new URL(url)

    expect(parsed.origin).toBe(new URL(DEFAULT_VALUES.DEV.WEB_URL).origin)
    expect(parsed.pathname).toBe("/login")
    expect(parsed.searchParams.get("cli_callback")).toBe("http://127.0.0.1:12345/callback")
  })

  it("maps local API URL using env.common", () => {
    const url = resolveCLILoginUrl(DEFAULT_VALUES.LOCAL.API_URL, "http://127.0.0.1:12345/callback")
    const parsed = new URL(url)

    expect(parsed.origin).toBe(new URL(DEFAULT_VALUES.LOCAL.WEB_URL).origin)
    expect(parsed.pathname).toBe("/login")
    expect(parsed.searchParams.get("cli_callback")).toBe("http://127.0.0.1:12345/callback")
  })

  it("falls back to API origin when no mapping exists", () => {
    const url = resolveCLILoginUrl("https://api.follow.is", "http://localhost:3456/callback")
    const parsed = new URL(url)

    expect(parsed.origin).toBe("https://api.follow.is")
    expect(parsed.pathname).toBe("/login")
    expect(parsed.searchParams.get("cli_callback")).toBe("http://localhost:3456/callback")
  })

  it("throws for invalid api url", () => {
    expect(() => resolveCLILoginUrl("not-a-url", "http://127.0.0.1:3333/callback")).toThrowError(
      /Invalid API URL/,
    )
  })
})
