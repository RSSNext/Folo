import { afterEach, describe, expect, it, vi } from "vitest"

import { runCLI } from "./program"

// Keeps the user's stored token and API URL out of the commands
vi.mock("./config", () => ({ readConfig: async () => ({}) }))

/** What Node's fetch throws when nothing listens on the port: its cause is an AggregateError
 * with an empty message and the code of the failure */
const connectionRefused = () =>
  new TypeError("fetch failed", { cause: { code: "ECONNREFUSED", message: "" } })

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  process.exitCode = undefined
})

describe("an API the CLI cannot reach", () => {
  it.each([
    [["timeline"]],
    [["subscription", "list"]],
    [["unread", "count"]],
    [["opml", "export"]],
    [["whoami"]],
  ])("fails `folo %s` with NETWORK_ERROR and leaves no timer behind", async (args) => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw connectionRefused()
      }),
    )
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(console, "info").mockImplementation(() => {})

    await runCLI(["node", "folo", "--api-url", "http://127.0.0.1:9", "--token", "token", ...args])

    expect(JSON.parse(String(stderr.mock.calls[0]![0]))).toEqual({
      ok: false,
      data: null,
      error: {
        code: "NETWORK_ERROR",
        message: "Cannot reach the API at http://127.0.0.1:9 (ECONNREFUSED).",
      },
    })
    expect(process.exitCode).toBe(1)
    // The SDK's 30 s request timeout kept the process alive after the error was printed
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe("an API that does not answer in time", () => {
  it("fails with TIMEOUT_ERROR once the SDK gives up waiting", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_input: unknown, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            // How Node's fetch fails a request whose signal aborted
            init?.signal?.addEventListener("abort", () => {
              reject(new DOMException("This operation was aborted", "AbortError"))
            })
          }),
      ),
    )
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(console, "info").mockImplementation(() => {})

    const run = runCLI([
      "node",
      "folo",
      "--api-url",
      "http://127.0.0.1:9",
      "--token",
      "t",
      "timeline",
    ])
    await vi.advanceTimersByTimeAsync(30_000)
    await run

    expect(JSON.parse(String(stderr.mock.calls[0]![0]))).toMatchObject({
      ok: false,
      error: { code: "TIMEOUT_ERROR", message: "Request timeout" },
    })
    expect(process.exitCode).toBe(1)
    expect(vi.getTimerCount()).toBe(0)
  })
})
