import { afterEach, describe, expect, it, vi } from "vitest"

import { updateConfig } from "../config"
import { runCLI } from "../program"

// Keeps the user's stored token and API URL out of the commands, and their config unchanged
vi.mock("../config", () => ({
  readConfig: async () => ({}),
  updateConfig: vi.fn(async (patch: Record<string, unknown>) => patch),
  clearToken: vi.fn(async () => {}),
  getConfigPath: () => "/home/user/.folo/config.json",
}))

const session = { user: { id: "user1", name: "User" }, session: { id: "session1" } }

/** Runs the CLI against an API that knows the session token "token" */
const run = async (...args: string[]) => {
  const requests: string[] = []
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      requests.push(url)
      const { pathname } = new URL(url)
      if (pathname === "/better-auth/get-session") {
        const known = new Headers(init?.headers).get("authorization") === "Bearer token"
        // Better Auth answers a token it does not know with 200 and a null body
        return Response.json(known ? session : null)
      }
      if (pathname === "/better-auth/one-time-token/apply") {
        return Response.json({ message: "Invalid token" }, { status: 400 })
      }
      return new Response("404 Not Found", { status: 404 })
    }),
  )
  const stdout = vi.spyOn(console, "info").mockImplementation(() => {})
  const stderr = vi.spyOn(console, "error").mockImplementation(() => {})

  await runCLI(["node", "folo", ...args])

  return {
    requests,
    stdout: stdout.mock.calls.map(([line]) => String(line)).join("\n"),
    stderr: stderr.mock.calls.map(([line]) => String(line)).join("\n"),
    exitCode: process.exitCode,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.mocked(updateConfig).mockClear()
  process.exitCode = undefined
})

describe("an API URL with a trailing slash", () => {
  it("shows the session", async () => {
    const { requests, stdout, stderr, exitCode } = await run(
      "--api-url",
      "http://api.test/",
      "--token",
      "token",
      "whoami",
    )

    expect(requests).toEqual(["http://api.test/better-auth/get-session"])
    expect(stderr).toBe("")
    expect(JSON.parse(stdout)).toMatchObject({ ok: true, data: session })
    expect(exitCode).toBeUndefined()
  })

  it("signs in and saves the URL without the slash", async () => {
    const { stdout, stderr } = await run(
      "--api-url",
      "http://api.test/",
      "login",
      "--token",
      "token",
    )

    expect(stderr).toBe("")
    expect(JSON.parse(stdout)).toMatchObject({ ok: true, data: { user: session.user } })
    expect(updateConfig).toHaveBeenCalledWith({ token: "token", apiUrl: "http://api.test" })
  })
})

describe("a token the API does not know", () => {
  it.each([
    [["--token", "expired", "whoami"]],
    [["--token", "expired", "auth", "whoami"]],
    [["login", "--token", "expired"]],
  ])("fails `folo %s` as unauthorized", async (args) => {
    const { stdout, stderr, exitCode } = await run(...args)

    expect(stdout).toBe("")
    expect(JSON.parse(stderr)).toEqual({
      ok: false,
      data: null,
      error: { code: "UNAUTHORIZED", message: "Token is invalid or expired." },
    })
    expect(exitCode).toBe(1)
    expect(updateConfig).not.toHaveBeenCalled()
  })

  it("is printed as a failure in table format", async () => {
    const { stdout, stderr } = await run("-f", "table", "--token", "expired", "whoami")

    expect(stdout).toBe("")
    expect(stderr).toBe("[UNAUTHORIZED] Token is invalid or expired.")
  })
})
