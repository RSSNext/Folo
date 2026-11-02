import { describe, expect, it, vi } from "vitest"

import { runCLIWithAPI } from "../test-utils"

// Keeps the user's stored token and API URL out of the commands
vi.mock("../config", () => ({ readConfig: async () => ({}) }))

describe("feed get", () => {
  it.each([
    ["rsshub://test/73101", { url: "rsshub://test/73101" }],
    ["https://example.com/feed.xml", { url: "https://example.com/feed.xml" }],
    ["http://localhost:1200/test/73101", { url: "http://localhost:1200/test/73101" }],
    ["1337669122086932480", { id: "1337669122086932480" }],
  ])("looks %s up by %j", async (value, query) => {
    const { requests, exitCode } = await runCLIWithAPI(["feed", "get", value], () => ({
      code: 0,
      data: { feed: { id: "1" }, entries: [] },
    }))

    expect(requests).toMatchObject([{ method: "GET", path: "/feeds", query }])
    expect(exitCode).toBeUndefined()
  })
})
