import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { CLIError, normalizeError, printFailure, printSuccess } from "./output"

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
})
