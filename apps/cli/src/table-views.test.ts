import { describe, expect, it, vi } from "vitest"

import { runCLIWithAPI } from "./test-utils"

// Keeps the user's stored token and API URL out of the commands
vi.mock("./config", () => ({ readConfig: async () => ({}) }))

const entry = (id: string, title: string | null, description = "") => ({
  read: false,
  view: 0,
  from: ["feed"],
  feeds: { type: "feed", id: "f1", url: "https://example.com/feed.xml", title: "Example Feed" },
  entries: {
    id,
    title,
    description,
    url: `https://example.com/${id}`,
    publishedAt: "2026-10-17T22:17:20.350Z",
    media: [{ type: "photo", url: "https://example.com/1.png" }],
  },
  settings: {},
})

const tableLines = (output: string) => output.split("\n")

describe("table format", () => {
  it("prints a timeline entry per row", async () => {
    const { stdout } = await runCLIWithAPI(["-f", "table", "timeline", "--limit", "2"], () => ({
      code: 0,
      data: [entry("e1", "First entry"), entry("e2", null, "A post\nwithout a title")],
    }))

    expect(tableLines(stdout)).toEqual([
      "+----+------------------------+--------------+--------------------------+-------+",
      "| id | title                  | feed         | publishedAt              | read  |",
      "+----+------------------------+--------------+--------------------------+-------+",
      "| e1 | First entry            | Example Feed | 2026-10-17T22:17:20.350Z | false |",
      "| e2 | A post without a title | Example Feed | 2026-10-17T22:17:20.350Z | false |",
      "+----+------------------------+--------------+--------------------------+-------+",
      "nextCursor: 2026-10-17T22:17:20.350Z",
      expect.stringMatching(/^hasNext: (true|false)$/),
    ])
  })

  it("prints a subscription per row whatever it follows", async () => {
    const { stdout } = await runCLIWithAPI(["-f", "table", "subscription", "list"], () => ({
      code: 0,
      data: [
        {
          feedId: "f1",
          title: null,
          category: "Tech",
          view: 0,
          isPrivate: false,
          feeds: { id: "f1", title: "Example Feed", url: "https://example.com/feed.xml" },
        },
        {
          feedId: "l1",
          listId: "l1",
          title: "My name",
          view: 1,
          isPrivate: true,
          lists: { id: "l1", title: "A list", feedIds: [] },
        },
        {
          feedId: "i1",
          inboxId: "i1",
          title: null,
          category: null,
          view: 0,
          isPrivate: false,
          inboxes: { id: "i1", title: "Inbox" },
        },
      ],
    }))

    expect(tableLines(stdout)).toEqual([
      "+-------+----+--------------+----------+------+---------+",
      "| type  | id | title        | category | view | private |",
      "+-------+----+--------------+----------+------+---------+",
      "| feed  | f1 | Example Feed | Tech     | 0    | false   |",
      "| list  | l1 | My name      |          | 1    | true    |",
      "| inbox | i1 | Inbox        |          | 0    | false   |",
      "+-------+----+--------------+----------+------+---------+",
    ])
  })

  it("prints a list per row with the number of its feeds", async () => {
    const { stdout } = await runCLIWithAPI(["-f", "table", "list", "ls"], () => ({
      code: 0,
      data: [
        {
          id: "l1",
          title: "Reading",
          view: 0,
          fee: 0,
          feedIds: ["f1", "f2"],
          feeds: [],
          subscriptionCount: 3,
        },
      ],
    }))

    expect(tableLines(stdout)).toEqual([
      "+----+---------+------+-----+-------+-------------+",
      "| id | title   | view | fee | feeds | subscribers |",
      "+----+---------+------+-----+-------+-------------+",
      "| l1 | Reading | 0    | 0   | 2     | 3           |",
      "+----+---------+------+-----+-------+-------------+",
    ])
  })

  it("prints the session of whoami a field per row", async () => {
    const { stdout } = await runCLIWithAPI(["-f", "table", "whoami"], () => ({
      user: { id: "u1", name: "User" },
      session: { id: "s1", expiresAt: "2026-11-16T22:50:33.175Z" },
      role: "free",
    }))

    expect(tableLines(stdout)).toEqual([
      "+-------------------+--------------------------+",
      "| field             | value                    |",
      "+-------------------+--------------------------+",
      "| user.id           | u1                       |",
      "| user.name         | User                     |",
      "| session.id        | s1                       |",
      "| session.expiresAt | 2026-11-16T22:50:33.175Z |",
      "| role              | free                     |",
      "| roleEndAt         |                          |",
      "+-------------------+--------------------------+",
    ])
  })
})
