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

type Answer = (url: URL, init?: RequestInit) => Response

/** The API, which knows the session token "token" */
const answerAPI: Answer = ({ pathname }, init) => {
  if (pathname === "/better-auth/get-session") {
    const known = new Headers(init?.headers).get("authorization") === "Bearer token"
    // Better Auth answers a token it does not know with 200 and a null body
    return Response.json(known ? session : null)
  }
  if (pathname === "/better-auth/one-time-token/apply") {
    return Response.json({ message: "Invalid token" }, { status: 400 })
  }
  return new Response("404 Not Found", { status: 404 })
}

/** Runs the CLI against a server that `answer` answers, the API by default */
const runWith = async (answer: Answer, ...args: string[]) => {
  const requests: string[] = []
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      requests.push(url)
      return answer(new URL(url), init)
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

const run = async (...args: string[]) => runWith(answerAPI, ...args)

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

describe("an API URL that names something else", () => {
  // A web app answers every path with its page
  const answerPage: Answer = () =>
    new Response("<!doctype html><title>Folo</title>", { headers: { "content-type": "text/html" } })
  // A static host refuses to post and answers every page it serves
  const answerStaticPage: Answer = (_url, init) =>
    init?.method === "POST" ? new Response("Method Not Allowed", { status: 405 }) : answerPage(_url)
  const answerNotFound: Answer = () => new Response("404 Not Found", { status: 404 })

  it.each([
    ["whoami", "a web app", answerPage, ["--token", "token", "whoami"], "INVALID_RESPONSE"],
    ["login", "a web app", answerPage, ["login", "--token", "token"], "INVALID_RESPONSE"],
    ["login", "a static host", answerStaticPage, ["login", "--token", "token"], "INVALID_RESPONSE"],
    [
      "whoami",
      "a server without the API",
      answerNotFound,
      ["--token", "token", "whoami"],
      "HTTP_404",
    ],
    [
      "login",
      "a server without the API",
      answerNotFound,
      ["login", "--token", "token"],
      "HTTP_404",
    ],
  ] as const)(
    "fails `folo %s` at %s without blaming the token",
    async (_command, _server, answer, args, code) => {
      const { stdout, stderr, exitCode } = await runWith(
        answer,
        "--api-url",
        "http://web.test",
        ...args,
      )

      expect(stdout).toBe("")
      expect(JSON.parse(stderr)).toMatchObject({ ok: false, data: null, error: { code } })
      expect(exitCode).toBe(1)
      expect(updateConfig).not.toHaveBeenCalled()
    },
  )

  it("names the URL to check", async () => {
    const { stderr } = await runWith(
      answerPage,
      "--api-url",
      "http://web.test",
      "--token",
      "token",
      "whoami",
    )

    expect(JSON.parse(stderr)).toMatchObject({
      error: {
        code: "INVALID_RESPONSE",
        message:
          "The server at http://web.test answered with something other than JSON. Check --api-url.",
      },
    })
  })
})
