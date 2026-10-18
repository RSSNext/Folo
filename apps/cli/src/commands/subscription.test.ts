import { describe, expect, it, vi } from "vitest"

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
