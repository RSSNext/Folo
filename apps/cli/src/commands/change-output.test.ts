import { Command } from "commander"
import { afterEach, describe, expect, it, vi } from "vitest"

import { parseFormat } from "../args"
import { registerCollectionCommand } from "./collection"
import { registerEntryCommand } from "./entry"
import { registerFeedCommand } from "./feed"
import { registerListCommand } from "./list"
import { registerSubscriptionCommand } from "./subscription"

// Keeps the user's stored token and API URL out of the commands
vi.mock("../config", () => ({ readConfig: async () => ({}) }))

interface APIRequest {
  method: string
  path: string
}

/** Runs a command against an API that answers every request with `body` */
const runCLI = async (args: string[], body: Record<string, unknown>) => {
  const requests: APIRequest[] = []
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      requests.push({ method: init?.method ?? "GET", path: new URL(url).pathname })
      return new Response(JSON.stringify(body), {
        headers: { "content-type": "application/json" },
      })
    }),
  )
  const info = vi.spyOn(console, "info").mockImplementation(() => {})
  const error = vi.spyOn(console, "error").mockImplementation(() => {})

  const program = new Command()
    .exitOverride()
    .option("-f, --format <format>", "Output format", parseFormat, "json")
    .option("--api-url <url>", "API base URL")
    .option("--token <token>", "Override stored token")
    .option("--verbose", "Enable verbose request/response logging", false)
  registerSubscriptionCommand(program)
  registerCollectionCommand(program)
  registerEntryCommand(program)
  registerFeedCommand(program)
  registerListCommand(program)

  await program.parseAsync(["--token", "token", "--api-url", "http://api.test", ...args], {
    from: "user",
  })

  expect(error.mock.calls).toEqual([])
  return { output: info.mock.calls.map(([line]) => String(line)).join("\n"), requests }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  process.exitCode = undefined
})

describe("change commands", () => {
  const feed = { type: "feed", id: "feed1", url: "https://example.com/feed.xml" }

  // What the API answers each change with: no data field, at most the sync id of the change
  it.each([
    {
      args: ["subscription", "add", "--feed", feed.url],
      request: { method: "POST", path: "/subscriptions" },
      response: { code: 0, feed, list: null, unread: { feed1: 2 }, lastSyncId: 40 },
      data: { feed, list: null, unread: { feed1: 2 }, lastSyncId: 40 },
    },
    {
      args: ["subscription", "remove", "feed1"],
      request: { method: "DELETE", path: "/subscriptions" },
      response: { code: 0, lastSyncId: 41 },
      data: { lastSyncId: 41 },
    },
    {
      args: ["subscription", "update", "feed1", "--category", "Tech"],
      request: { method: "PATCH", path: "/subscriptions" },
      response: { code: 0, lastSyncId: 42 },
      data: { lastSyncId: 42 },
    },
    {
      args: ["collection", "add", "entry1"],
      request: { method: "POST", path: "/collections" },
      response: { code: 0, lastSyncId: 43 },
      data: { lastSyncId: 43 },
    },
    {
      // A change the server recorded no sync action for
      args: ["collection", "remove", "entry1"],
      request: { method: "DELETE", path: "/collections" },
      response: { code: 0 },
      data: {},
    },
    {
      args: ["entry", "mark-read", "entry1"],
      request: { method: "POST", path: "/reads" },
      response: { code: 0, lastSyncId: 44 },
      data: { lastSyncId: 44 },
    },
    {
      args: ["entry", "mark-unread", "entry1"],
      request: { method: "DELETE", path: "/reads" },
      response: { code: 0, lastSyncId: 45 },
      data: { lastSyncId: 45 },
    },
    {
      args: ["feed", "refresh", "feed1"],
      request: { method: "GET", path: "/feeds/refresh" },
      response: { code: 0 },
      data: {},
    },
    {
      args: ["list", "update", "list1", "--title", "News"],
      request: { method: "PATCH", path: "/lists" },
      response: { code: 0 },
      data: {},
    },
    {
      args: ["list", "delete", "list1"],
      request: { method: "DELETE", path: "/lists" },
      response: { code: 0 },
      data: {},
    },
    {
      args: ["list", "remove-feed", "list1", "--feed", "feed1"],
      request: { method: "DELETE", path: "/lists/feeds" },
      response: { code: 0 },
      data: {},
    },
  ])(
    "prints what the API answers `$args.0 $args.1` with",
    async ({ args, request, response, data }) => {
      const { output, requests } = await runCLI(args, response)

      expect(requests).toEqual([request])
      expect(JSON.parse(output)).toEqual({ ok: true, data, error: null })
    },
  )

  it("prints the sync id of a change as a table", async () => {
    const { output } = await runCLI(["--format", "table", "subscription", "remove", "feed1"], {
      code: 0,
      lastSyncId: 41,
    })

    expect(output).toContain("| lastSyncId |")
    expect(output).toContain("| 41         |")
  })

  it("prints a change the API answers with no fields as an empty table", async () => {
    const { output } = await runCLI(["--format", "table", "list", "delete", "list1"], { code: 0 })

    expect(output).toBe("(empty)")
  })
})
