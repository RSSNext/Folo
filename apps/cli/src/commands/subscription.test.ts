import { describe, expect, it, vi } from "vitest"

import type { APIRequest } from "../test-utils"
import { parseEnvelope, runCLIWithAPI } from "../test-utils"

// Keeps the user's stored token and API URL out of the commands
vi.mock("../config", () => ({ readConfig: async () => ({}) }))

describe("subscription add", () => {
  it.each(["not-a-url", "http://localhost:1200/does/not/exist", "https://example.com"])(
    "fails when the API followed nothing at %s",
    async (url) => {
      // What the API answers when it finds no feed at the URL
      const { requests, stdout, stderr, exitCode } = await runCLIWithAPI(
        ["subscription", "add", "--feed", url],
        () => ({ code: 0, feed: null, list: null, unread: {} }),
      )

      expect(requests).toMatchObject([
        { method: "POST", path: "/subscriptions", body: { url, type: "feed" } },
      ])
      expect(stdout).toBe("")
      expect(parseEnvelope(stderr)).toEqual({
        ok: false,
        data: null,
        error: { code: "NOT_FOUND", message: `No feed found at ${url}.` },
      })
      expect(exitCode).toBe(1)
    },
  )

  it("prints the feed it followed", async () => {
    const feed = { id: "f1", url: "https://example.com/feed.xml", title: "Example" }

    const { stdout, exitCode } = await runCLIWithAPI(
      ["subscription", "add", "--feed", feed.url],
      () => ({ code: 0, feed, list: null, unread: { f1: 3 }, lastSyncId: 7 }),
    )

    expect(parseEnvelope(stdout)).toEqual({
      ok: true,
      data: { feed, list: null, unread: { f1: 3 }, lastSyncId: 7 },
      error: null,
    })
    expect(exitCode).toBeUndefined()
  })
})

/** GET /subscriptions of a user who follows a feed and a list, and has an inbox */
const followed = [
  {
    feedId: "100",
    view: 0,
    category: "Tech",
    isPrivate: false,
    feeds: { id: "100", url: "rsshub://github/issue/DIYgod/RSSHub", title: "Issues" },
  },
  { feedId: "200", listId: "200", view: 0, isPrivate: false, lists: { id: "200", feedIds: [] } },
  { feedId: "inbox-300", inboxId: "300", view: 0, isPrivate: false, inboxes: { id: "300" } },
]

/** The API: the subscriptions above, and success with a sync id for every change */
const answerSubscriptions = (request: APIRequest) =>
  request.method === "GET" && request.path === "/subscriptions"
    ? { code: 0, data: followed }
    : { code: 0, lastSyncId: 9 }

const changes = (requests: APIRequest[]) =>
  requests
    .filter((request) => request.method !== "GET")
    .map(({ method, body }) => ({ method, body }))

describe.each([[["subscription", "remove"]], [["subscription", "update", "--category", "News"]]])(
  "%s",
  (command) => {
    it.each([
      [["999999999999999999"], "You don't follow a feed or list with id 999999999999999999."],
      [["300"], "You don't follow a feed or list with id 300."],
      [["100", "--target", "list"], "You don't follow a list with id 100."],
    ])(
      "fails for %s, which the user does not follow, without changing it",
      async (args, message) => {
        const { requests, stdout, stderr, exitCode } = await runCLIWithAPI(
          [...command, ...args],
          answerSubscriptions,
        )

        expect(changes(requests)).toEqual([])
        expect(stdout).toBe("")
        expect(parseEnvelope(stderr)).toEqual({
          ok: false,
          data: null,
          error: { code: "NOT_FOUND", message },
        })
        expect(exitCode).toBe(1)
      },
    )
  },
)

describe("subscription remove", () => {
  it.each([
    [["100"], { feedId: "100" }],
    // A list's id is taken as a feed id too, and sent as the list it is
    [["200"], { listId: "200" }],
    [["200", "--target", "list"], { listId: "200" }],
    [
      ["rsshub://github/issue/DIYgod/RSSHub", "--target", "url"],
      {
        url: "rsshub://github/issue/DIYgod/RSSHub",
      },
    ],
  ])("unfollows what %s names", async (args, body) => {
    const { requests, stdout } = await runCLIWithAPI(
      ["subscription", "remove", ...args],
      answerSubscriptions,
    )

    expect(changes(requests)).toEqual([{ method: "DELETE", body }])
    expect(parseEnvelope(stdout)).toEqual({ ok: true, data: { lastSyncId: 9 }, error: null })
  })
})

describe("subscription update", () => {
  it.each([
    [["100"], { feedId: "100" }],
    [["200"], { listId: "200" }],
    [["200", "--target", "list"], { listId: "200" }],
  ])("changes what %s names", async (args, target) => {
    const { requests, stdout } = await runCLIWithAPI(
      ["subscription", "update", ...args, "--title", "Mine"],
      answerSubscriptions,
    )

    expect(changes(requests)).toEqual([{ method: "PATCH", body: { title: "Mine", ...target } }])
    expect(parseEnvelope(stdout)).toEqual({ ok: true, data: { lastSyncId: 9 }, error: null })
  })

  it("checks the fields before asking the API", async () => {
    const { requests, stderr } = await runCLIWithAPI(
      ["subscription", "update", "100"],
      answerSubscriptions,
    )

    expect(requests).toEqual([])
    expect(parseEnvelope(stderr)).toMatchObject({ error: { code: "INVALID_ARGUMENT" } })
  })
})

describe("subscription remove --target url", () => {
  /** The API, which stores feeds of RSSHub instances as rsshub:// URLs */
  const answerWithFeeds = (request: APIRequest) => {
    if (request.method === "GET" && request.path === "/feeds") {
      const url = request.query.url ?? ""
      const known: Record<string, { id: string; url: string }> = {
        "https://rsshub.app/github/issue/DIYgod/RSSHub": {
          id: "100",
          url: "rsshub://github/issue/DIYgod/RSSHub",
        },
        "https://example.com/feed.xml": { id: "400", url: "https://example.com/feed.xml" },
      }
      return known[url]
        ? { code: 0, data: { feed: known[url], entries: [] } }
        : Response.json({ code: 2001, message: "Feed not found" }, { status: 404 })
    }
    return answerSubscriptions(request)
  }

  it("unfollows a feed by the RSSHub URL it was followed with", async () => {
    const { requests, stdout } = await runCLIWithAPI(
      [
        "subscription",
        "remove",
        "https://rsshub.app/github/issue/DIYgod/RSSHub",
        "--target",
        "url",
      ],
      answerWithFeeds,
    )

    expect(requests).toMatchObject([
      { method: "GET", path: "/subscriptions" },
      {
        method: "GET",
        path: "/feeds",
        query: { url: "https://rsshub.app/github/issue/DIYgod/RSSHub" },
      },
      { method: "DELETE", body: { url: "rsshub://github/issue/DIYgod/RSSHub" } },
    ])
    expect(parseEnvelope(stdout)).toEqual({ ok: true, data: { lastSyncId: 9 }, error: null })
  })

  it.each(["https://example.com/feed.xml", "https://example.com/unknown.xml"])(
    "fails for %s, a feed the user does not follow",
    async (url) => {
      const { requests, stderr } = await runCLIWithAPI(
        ["subscription", "remove", url, "--target", "url"],
        answerWithFeeds,
      )

      expect(changes(requests)).toEqual([])
      expect(parseEnvelope(stderr)).toEqual({
        ok: false,
        data: null,
        error: { code: "NOT_FOUND", message: `You don't follow a feed at ${url}.` },
      })
    },
  )

  it("reports a feed lookup the API failed instead of saying the feed isn't followed", async () => {
    const { requests, stderr, exitCode } = await runCLIWithAPI(
      [
        "subscription",
        "remove",
        "https://rsshub.app/github/issue/DIYgod/RSSHub",
        "--target",
        "url",
      ],
      (request) =>
        request.method === "GET" && request.path === "/feeds"
          ? new Response("Bad Gateway", { status: 502, statusText: "Bad Gateway" })
          : answerSubscriptions(request),
    )

    expect(changes(requests)).toEqual([])
    expect(parseEnvelope(stderr)).toMatchObject({
      ok: false,
      error: { code: "HTTP_502", message: "Bad Gateway" },
    })
    expect(exitCode).toBe(1)
  })
})
