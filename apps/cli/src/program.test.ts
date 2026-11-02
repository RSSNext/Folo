import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import packageJSON from "../package.json"
import { resolveRequestedFormat, runCLI } from "./program"

// Keeps the user's stored token and API URL out of the commands
vi.mock("./config", () => ({ readConfig: async () => ({}) }))

/** Runs the CLI as a shell would and collects what it printed */
const run = async (...args: string[]) => {
  const stdout: string[] = []
  const stderr: string[] = []
  vi.spyOn(console, "info").mockImplementation((line: unknown) => {
    stdout.push(String(line))
  })
  vi.spyOn(console, "error").mockImplementation((line: unknown) => {
    stderr.push(String(line))
  })
  vi.spyOn(process.stdout, "write").mockImplementation((chunk: string | Uint8Array) => {
    stdout.push(String(chunk))
    return true
  })
  vi.spyOn(process.stderr, "write").mockImplementation((chunk: string | Uint8Array) => {
    stderr.push(String(chunk))
    return true
  })
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new Error("A usage error must not reach the API")
    }),
  )

  await runCLI(["node", "folo", ...args])

  return { stdout: stdout.join(""), stderr: stderr.join(""), exitCode: process.exitCode }
}

const parseFailure = (output: string) =>
  JSON.parse(output) as { ok: boolean; data: null; error: { code: string; message: string } }

beforeEach(() => {
  process.exitCode = undefined
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  process.exitCode = undefined
})

describe("usage errors", () => {
  it.each([
    [["timeline", "--bogus"], "unknown option '--bogus'"],
    [["frobnicate"], "unknown command 'frobnicate'"],
    [["entry", "get"], "missing required argument 'entryId'"],
    [
      ["entry", "get", "a", "b"],
      "too many arguments for 'get'. Expected 1 argument but got 2: a, b.",
    ],
    [["list", "create"], "required option '--title <title>' not specified"],
    [["timeline", "--limit"], "option '--limit <n>' argument missing"],
    [
      ["timeline", "--limit", "abc"],
      "option '--limit <n>' argument 'abc' is invalid. Expected a positive integer.",
    ],
    [
      ["timeline", "--limit", "1e3"],
      "option '--limit <n>' argument '1e3' is invalid. Expected a positive integer.",
    ],
    [
      ["subscription", "add", "--feed", "x", "--view", "banana"],
      "option '--view <type>' argument 'banana' is invalid. Invalid view. Use articles(0) | social(1) | pictures(2) | videos(3) | audio(4) | notifications(5).",
    ],
    [
      ["subscription", "remove", "1", "--target", "banana"],
      "option '--target <target>' argument 'banana' is invalid. Invalid target. Use feed, list or url.",
    ],
    [
      ["timeline", "--cursor", "yesterday-ish"],
      "option '--cursor <datetime>' argument 'yesterday-ish' is invalid. Invalid datetime. Use an ISO 8601 date such as 2026-02-25T10:30:00Z.",
    ],
    [
      ["--format", "yaml", "unread", "count"],
      "option '-f, --format <format>' argument 'yaml' is invalid. Invalid format. Use json, table or plain.",
    ],
    [
      ["subscription"],
      "Missing command. Run `folo subscription --help` to see the commands it accepts.",
    ],
    [[], "Missing command. Run `folo --help` to see the commands it accepts."],
  ])("prints `folo %s` as an INVALID_ARGUMENT envelope", async (args, message) => {
    const { stdout, stderr, exitCode } = await run(...args)

    expect(stdout).toBe("")
    expect(parseFailure(stderr)).toEqual({
      ok: false,
      data: null,
      error: { code: "INVALID_ARGUMENT", message },
    })
    expect(exitCode).toBe(1)
  })

  it("keeps the suggestion Commander adds on one line", async () => {
    const { stderr } = await run("timline")

    expect(parseFailure(stderr).error.message).toBe(
      "unknown command 'timline' (Did you mean timeline?)",
    )
  })

  it("prints usage errors in the format asked for", async () => {
    await expect(run("-f", "table", "timeline", "--bogus")).resolves.toMatchObject({
      stderr: "[INVALID_ARGUMENT] unknown option '--bogus'",
      exitCode: 1,
    })
    await expect(run("--format=plain", "timeline", "--bogus")).resolves.toMatchObject({
      stderr: "[INVALID_ARGUMENT] unknown option '--bogus'",
      exitCode: 1,
    })
  })
})

describe("help and version", () => {
  it.each([[["--help"]], [["timeline", "--help"]], [["help", "subscription"]], [["help"]]])(
    "prints `folo %s` to stdout and succeeds",
    async (args) => {
      const { stdout, stderr, exitCode } = await run(...args)

      expect(stdout).toContain("Usage: folo")
      expect(stderr).toBe("")
      expect(exitCode).toBeUndefined()
    },
  )

  it("prints the version", async () => {
    await expect(run("--version")).resolves.toEqual({
      stdout: `${packageJSON.version}\n`,
      stderr: "",
      exitCode: undefined,
    })
  })
})

describe("resolveRequestedFormat", () => {
  it("reads every way of passing --format", () => {
    expect(resolveRequestedFormat(["-f", "table"])).toBe("table")
    expect(resolveRequestedFormat(["--format", "plain"])).toBe("plain")
    expect(resolveRequestedFormat(["--format=table"])).toBe("table")
    expect(resolveRequestedFormat(["-fplain"])).toBe("plain")
  })

  it("falls back to JSON", () => {
    expect(resolveRequestedFormat([])).toBe("json")
    expect(resolveRequestedFormat(["--format", "yaml"])).toBe("json")
    expect(resolveRequestedFormat(["--", "-f", "table"])).toBe("json")
  })
})
