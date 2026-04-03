import { Agent, request } from "node:http"

import { afterEach, describe, expect, it, vi } from "vitest"

import { DEFAULT_VALUES } from "../../../packages/internal/shared/src/env.common"
import { loginWithBrowser, resolveBrowserLoginToken, resolveCLILoginUrl } from "./browser-login"
import { CLIError } from "./output"

vi.mock("node:child_process", () => ({
  spawnSync: vi.fn(() => ({ status: 0 })),
}))

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

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

  it("resolves browser login without waiting on a kept-alive callback socket", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          session: { token: "session-token" },
          user: { id: "user-1" },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    let loginUrl: string | undefined
    const loginPromise = loginWithBrowser({
      apiUrl: DEFAULT_VALUES.PROD.API_URL,
      timeoutMs: 1_000,
      onStatus: (message) => {
        const prefix = "Open this URL to sign in: "
        if (message.startsWith(prefix)) {
          loginUrl = message.slice(prefix.length)
        }
      },
    })

    await vi.waitFor(() => {
      expect(loginUrl).toBeTruthy()
    })

    const callbackUrl = new URL(loginUrl!).searchParams.get("cli_callback")
    expect(callbackUrl).toBeTruthy()

    const callbackRequestUrl = new URL(callbackUrl!)
    callbackRequestUrl.searchParams.set("token", "one-time-token")

    const agent = new Agent({ keepAlive: true })

    try {
      const response = await new Promise<{ body: string; connectionHeader?: string }>(
        (resolve, reject) => {
          const req = request(
            callbackRequestUrl,
            {
              agent,
              headers: {
                Connection: "keep-alive",
              },
            },
            (res) => {
              let body = ""
              res.setEncoding("utf8")
              res.on("data", (chunk) => {
                body += chunk
              })
              res.on("end", () => {
                const connectionHeader = Array.isArray(res.headers.connection)
                  ? res.headers.connection[0]
                  : res.headers.connection
                resolve({ body, connectionHeader })
              })
            },
          )

          req.on("error", reject)
          req.end()
        },
      )

      expect(response.body).toContain("Folo CLI login complete")
      expect(response.connectionHeader).toBe("close")

      await expect(loginPromise).resolves.toEqual(
        expect.objectContaining({
          token: "session-token",
          callbackUrl,
          loginUrl,
        }),
      )
    } finally {
      agent.destroy()
    }
  })

  it("exchanges one-time token for a session token", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          user: { id: "user-1" },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
            "set-cookie":
              "__Secure-better-auth.session_token=session-token; Path=/; HttpOnly; Secure; SameSite=None",
          },
        },
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    const token = await resolveBrowserLoginToken(DEFAULT_VALUES.PROD.API_URL, "one-time-token")

    expect(token).toBe("session-token")
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.folo.is/better-auth/one-time-token/apply",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: "one-time-token" }),
      }),
    )
  })

  it("falls back to verify when apply endpoint is unavailable", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 404,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            session: { token: "session-token" },
            user: { id: "user-1" },
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      )
    vi.stubGlobal("fetch", fetchMock)

    const token = await resolveBrowserLoginToken(DEFAULT_VALUES.PROD.API_URL, "one-time-token")

    expect(token).toBe("session-token")
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.folo.is/better-auth/one-time-token/apply",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: "one-time-token" }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.folo.is/better-auth/one-time-token/verify",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: "one-time-token" }),
      }),
    )
  })

  it("falls back when the callback already contains a session token", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Invalid token" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            session: { id: "session-1" },
            user: { id: "user-1" },
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      )
    vi.stubGlobal("fetch", fetchMock)

    const token = await resolveBrowserLoginToken(DEFAULT_VALUES.PROD.API_URL, "session-token")

    expect(token).toBe("session-token")
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.folo.is/better-auth/get-session",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer session-token",
          Cookie:
            "__Secure-better-auth.session_token=session-token; better-auth.session_token=session-token",
        }),
      }),
    )
  })

  it("surfaces verification failures when neither token path works", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Token expired" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      )
    vi.stubGlobal("fetch", fetchMock)

    await expect(
      resolveBrowserLoginToken(DEFAULT_VALUES.PROD.API_URL, "expired-token"),
    ).rejects.toEqual(
      new CLIError("UNAUTHORIZED", "Browser login token verification failed: Token expired"),
    )
  })

  it("throws invalid argument for malformed api url", async () => {
    await expect(resolveBrowserLoginToken("not-a-url", "token")).rejects.toEqual(
      new CLIError("INVALID_ARGUMENT", "Invalid API URL: not-a-url"),
    )
  })
})
