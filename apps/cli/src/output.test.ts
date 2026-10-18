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

  it("normalizes CLIError", () => {
    const normalized = normalizeError(new CLIError("E_CODE", "message"))
    expect(normalized).toEqual({
      code: "E_CODE",
      message: "message",
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
