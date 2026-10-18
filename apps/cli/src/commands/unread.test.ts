import { describe, expect, it, vi } from "vitest"

import type { APIRequest } from "../test-utils"
import { parseEnvelope, runCLIWithAPI } from "../test-utils"

// Keeps the user's stored token and API URL out of the commands
vi.mock("../config", () => ({ readConfig: async () => ({}) }))

interface UnreadItem {
  sourceType: string
  sourceId: string
  unreadCount: number
}

/**
 * A user who follows feed f1 directly and list l1 with f1, f2 and f3. GET /reads counts the
 * unread entries of every feed the timeline holds, also those only reachable through the list.
 */
const answer = (request: APIRequest) => {
  if (request.path === "/reads") {
    return { code: 0, data: { f1: 4, f2: 3, f3: 1 }, lastSyncId: 1 }
  }
  if (request.path === "/reads/total-count") {
    return { code: 0, data: { count: 8 } }
  }
  return {
    code: 0,
    data: [
      { feedId: "f1", view: 0, isPrivate: false, feeds: { id: "f1", title: "Feed one" } },
      {
        feedId: "l1",
        listId: "l1",
        view: 0,
        isPrivate: false,
        lists: { id: "l1", title: "A list", feedIds: ["f1", "f2", "f3"] },
      },
    ],
  }
}

describe("unread list", () => {
  it("counts a list by its feeds and every entry once in the total", async () => {
    const list = await runCLIWithAPI(["unread", "list"], answer)
    const count = await runCLIWithAPI(["unread", "count"], answer)

    const listEnvelope = parseEnvelope<{ total: number; items: UnreadItem[] }>(list.stdout)
    const countEnvelope = parseEnvelope<{ count: number }>(count.stdout)
    expect(listEnvelope.ok && listEnvelope.data.items).toMatchObject([
      { sourceType: "list", sourceId: "l1", unreadCount: 8 },
      { sourceType: "feed", sourceId: "f1", unreadCount: 4 },
    ])
    expect(listEnvelope.ok && listEnvelope.data.total).toBe(8)
    expect(countEnvelope.ok && countEnvelope.data.count).toBe(8)
  })
})
