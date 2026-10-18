import { describe, expect, it, vi } from "vitest"

import { parseEnvelope, runCLIWithAPI } from "../test-utils"

// Keeps the user's stored token and API URL out of the commands
vi.mock("../config", () => ({ readConfig: async () => ({}) }))

describe("entry get", () => {
  it("fails for an id the API has no entry for", async () => {
    // The API answers such an id with success and no data
    const { requests, stdout, stderr, exitCode } = await runCLIWithAPI(
      ["entry", "get", "999999999999999999"],
      () => ({ code: 0 }),
    )

    expect(requests).toMatchObject([
      { method: "GET", path: "/entries", query: { id: "999999999999999999" } },
    ])
    expect(stdout).toBe("")
    expect(parseEnvelope(stderr)).toEqual({
      ok: false,
      data: null,
      error: { code: "NOT_FOUND", message: "Entry 999999999999999999 not found." },
    })
    expect(exitCode).toBe(1)
  })

  it("prints the entry the API found", async () => {
    const entry = { entries: { id: "1", title: "Hello" }, feeds: { id: "2", title: "Feed" } }

    const { stdout } = await runCLIWithAPI(["entry", "get", "1"], () => ({ code: 0, data: entry }))

    expect(parseEnvelope(stdout)).toEqual({ ok: true, data: entry, error: null })
  })
})

describe("entry read", () => {
  const content = `<p>${"word ".repeat(4000)}</p>\n<p>end</p>`

  it("prints the whole content as it is in plain mode", async () => {
    const { requests, stdout } = await runCLIWithAPI(["-f", "plain", "entry", "read", "1"], () => ({
      code: 0,
      data: { content },
    }))

    expect(requests).toMatchObject([{ method: "GET", path: "/entries/readability" }])
    expect(stdout).toBe(content)
  })

  it("keeps the content in the JSON envelope", async () => {
    const { stdout } = await runCLIWithAPI(["entry", "read", "1"], () => ({
      code: 0,
      data: { content },
    }))

    expect(parseEnvelope(stdout)).toEqual({ ok: true, data: { content }, error: null })
  })
})
