import { FollowAPIError, FollowAuthError, FollowTimeoutError } from "@follow-app/client-sdk"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  CLIError,
  describeFetchFailure,
  normalizeError,
  printFailure,
  printSuccess,
} from "./output"

describe("output helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("prints JSON success envelope", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {})

    printSuccess("json", { value: 1 })

    expect(infoSpy).toHaveBeenCalledTimes(1)
    const payload = JSON.parse(infoSpy.mock.calls[0]![0] as string) as {
      ok: boolean
      data: { value: number }
      error: null
    }
    expect(payload.ok).toBe(true)
    expect(payload.data).toEqual({ value: 1 })
    expect(payload.error).toBeNull()
  })

  it("prints JSON failure envelope", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    printFailure("json", { code: "E_TEST", message: "boom" })

    expect(errorSpy).toHaveBeenCalledTimes(1)
    const payload = JSON.parse(errorSpy.mock.calls[0]![0] as string) as {
      ok: boolean
      data: null
      error: { code: string; message: string }
    }
    expect(payload.ok).toBe(false)
    expect(payload.data).toBeNull()
    expect(payload.error).toEqual({ code: "E_TEST", message: "boom" })
  })

  it("prints ascii table in table mode", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {})

    printSuccess("table", [{ id: "a", count: 1 }])

    expect(infoSpy).toHaveBeenCalledTimes(1)
    const output = infoSpy.mock.calls[0]![0] as string
    expect(output).toContain("| id")
    expect(output).toContain("| a")
  })

  it("prints an empty table for a result without fields", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {})

    printSuccess("table", {})
    printSuccess("table", [])

    expect(infoSpy.mock.calls).toEqual([["(empty)"], ["(empty)"]])
  })

  describe("table", () => {
    const printTable = (data: unknown) => {
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {})
      printSuccess("table", data)
      return String(infoSpy.mock.calls[0]![0])
    }

    // Each line of a table is as wide as its border when no cell spans lines
    const expectAligned = (table: string) => {
      const lines = table.split("\n").filter((line) => line.startsWith("+") || line.startsWith("|"))
      const width = (line: string) =>
        [...line].reduce((sum, character) => sum + (/[\u3000-\u9FFF]/.test(character) ? 2 : 1), 0)
      expect(new Set(lines.map(width)).size).toBe(1)
    }

    it("prints a row per item of a page and the other fields below it", () => {
      const table = printTable({
        entries: [
          { id: "1", title: "First" },
          { id: "2", title: "Second" },
        ],
        nextCursor: "2026-10-17T22:17:20.350Z",
        hasNext: true,
      })

      expect(table).toBe(
        [
          "+----+--------+",
          "| id | title  |",
          "+----+--------+",
          "| 1  | First  |",
          "| 2  | Second |",
          "+----+--------+",
          "nextCursor: 2026-10-17T22:17:20.350Z",
          "hasNext: true",
        ].join("\n"),
      )
    })

    it("keeps every cell on one line", () => {
      const table = printTable([
        {
          title: `A title\nover lines and ${"long ".repeat(30)}`,
          feeds: { id: "f1", title: "Feed title", url: "https://example.com/feed" },
          tags: ["a", "b"],
          media: [{ url: "https://example.com/1.png" }, { url: "https://example.com/2.png" }],
          settings: { translation: false },
        },
      ])

      const row = table.split("\n")[3]!
      expect(row).toContain("| A title over lines and long long")
      expect(row).toContain("…")
      expect(row).toContain("| Feed title |")
      expect(row).toContain("| a, b |")
      expect(row).toContain("| 2 items |")
      expect(row).toContain('| {"translation":false} |')
      expectAligned(table)
    })

    it("prints a field per row for a detail", () => {
      const table = printTable({
        user: { id: "u1", name: "User", profile: { bio: "Hi" } },
        session: { id: "s1" },
        role: "free",
      })

      expect(table).toBe(
        [
          "+------------------+-------+",
          "| field            | value |",
          "+------------------+-------+",
          "| user.id          | u1    |",
          "| user.name        | User  |",
          "| user.profile.bio | Hi    |",
          "| session.id       | s1    |",
          "| role             | free  |",
          "+------------------+-------+",
        ].join("\n"),
      )
    })

    it("lines up titles in CJK", () => {
      const table = printTable([
        { id: "1", title: "少数派" },
        { id: "2", title: "Hacker News" },
      ])

      expectAligned(table)
    })
  })

  it("always prints a data field", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {})

    printSuccess("json", undefined)
    printSuccess("table", undefined)
    printSuccess("plain", undefined)

    expect(JSON.parse(infoSpy.mock.calls[0]![0] as string)).toEqual({
      ok: true,
      data: null,
      error: null,
    })
    expect(infoSpy.mock.calls.slice(1)).toEqual([["(empty)"], [""]])
  })

  it("prints long strings and arrays whole in plain mode", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {})
    const content = `${"a".repeat(15_000)}end`
    const ids = Array.from({ length: 150 }, (_, index) => index)

    printSuccess("plain", { content, ids })
    printSuccess("plain", [{ content }])

    const [[object], [array]] = infoSpy.mock.calls as [[string], [string]]
    expect(object).toContain(`'${content}'`)
    expect(object).toContain("149")
    expect(array).toContain(`'${content}'`)
    expect(`${object}${array}`).not.toMatch(/more (characters|items)/)
  })

  it("normalizes CLIError", () => {
    const normalized = normalizeError(new CLIError("E_CODE", "message"))
    expect(normalized).toEqual({
      code: "E_CODE",
      message: "message",
    })
  })

  it("names an answer without an error from the API by its HTTP status", () => {
    const notFound = new FollowAPIError("Not Found", 404, "404")

    expect(normalizeError(notFound)).toEqual({ code: "HTTP_404", message: "Not Found" })
  })

  it("keeps the API's own error code", () => {
    const notFound = new FollowAPIError("Feed not found", 404, "2001")

    expect(normalizeError(notFound)).toEqual({ code: "2001", message: "Feed not found" })
    expect(normalizeError(new FollowTimeoutError())).toEqual({
      code: "TIMEOUT_ERROR",
      message: "Request timeout",
    })
  })

  describe("with --verbose", () => {
    const request = {
      method: "POST",
      path: "/subscriptions",
      originalPath: "/subscriptions",
      body: { url: "https://example.com/feed.xml", category: null },
    }

    it("says what the refused request asked for", () => {
      const refused = new FollowAPIError("Feed fetch error", 400, "2003", undefined, { request })
      const unauthorized = new FollowAuthError("Unauthorized", undefined, {
        request: { method: "GET", path: "/subscriptions", originalPath: "/subscriptions" },
      })

      expect(normalizeError(refused, { verbose: true })).toEqual({
        code: "2003",
        message: "Feed fetch error",
        request,
      })
      expect(normalizeError(unauthorized, { verbose: true })).toEqual({
        code: "UNAUTHORIZED",
        message: "Unauthorized",
        request: { method: "GET", path: "/subscriptions", originalPath: "/subscriptions" },
      })
      // Without --verbose the error stays as small as it was
      expect(normalizeError(refused)).toEqual({ code: "2003", message: "Feed fetch error" })
    })

    it("prints the request in the JSON envelope and below the message", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      const output = normalizeError(
        new FollowAPIError("Feed fetch error", 400, "2003", undefined, {
          request: { ...request, path: "/api/subscriptions", query: { t: 1 } },
        }),
        { verbose: true },
      )

      printFailure("json", output)
      printFailure("plain", output)

      expect(JSON.parse(errorSpy.mock.calls[0]![0] as string).error.request).toEqual({
        ...request,
        path: "/api/subscriptions",
        query: { t: 1 },
      })
      expect(errorSpy.mock.calls.slice(1).map(([line]) => line)).toEqual([
        "[2003] Feed fetch error",
        [
          "Request: POST /api/subscriptions (original: /subscriptions)",
          'Query: {\n  "t": 1\n}',
          'Body: {\n  "url": "https://example.com/feed.xml",\n  "category": null\n}',
        ].join("\n"),
      ])
    })
  })

  it("normalizes generic Error", () => {
    const normalized = normalizeError(new Error("generic"))
    expect(normalized).toEqual({
      code: "UNKNOWN_ERROR",
      message: "generic",
    })
  })

  it("names the API and the reason when fetch could not reach it", () => {
    // Node's fetch reports a refused connection as an AggregateError with an empty message
    const refused = { code: "ECONNREFUSED", message: "" }

    expect(
      normalizeError(new TypeError("fetch failed", { cause: refused }), {
        apiUrl: "http://localhost:59999",
      }),
    ).toEqual({
      code: "NETWORK_ERROR",
      message: "Cannot reach the API at http://localhost:59999 (ECONNREFUSED).",
    })
  })

  it("describes why fetch failed", () => {
    const failure = (cause?: unknown) => new TypeError("fetch failed", { cause })
    const expired = Object.assign(new Error("certificate has expired"), {
      code: "CERT_HAS_EXPIRED",
    })
    const refused = Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:9"), {
      code: "ECONNREFUSED",
    })

    expect(describeFetchFailure(failure(expired))).toBe("CERT_HAS_EXPIRED: certificate has expired")
    expect(describeFetchFailure(failure(refused))).toBe("connect ECONNREFUSED 127.0.0.1:9")
    expect(describeFetchFailure(failure())).toBe("network error")
    expect(describeFetchFailure(new TypeError("Cannot read properties of null"))).toBeUndefined()
    expect(describeFetchFailure(new Error("fetch failed"))).toBeUndefined()
  })
})
