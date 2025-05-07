import { afterEach } from "node:test"

import { describe, expect, it } from "vitest"

import { browserDB } from "./db"

describe("upgradeToV8", () => {
  afterEach(async () => {
    await browserDB.delete()
  })

  it("should set tipUsers to an empty array if tipUsers is not an array", async () => {
    const insertFeeds = [
      { id: 1, tipUsers: {} },
      { id: 2, tipUsers: null },
      { id: 3, tipUsers: [{ name: "user1" }] },
    ]
    // @ts-expect-error
    await browserDB.feeds.bulkAdd(insertFeeds)

    const feeds = await browserDB.feeds.toArray()
    expect(feeds.length).toEqual(3)
    expect(feeds[0]!.tipUsers).toEqual(insertFeeds[0]!.tipUsers)
    expect(feeds[1]!.tipUsers).toEqual(insertFeeds[1]!.tipUsers)
    expect(feeds[2]!.tipUsers).toEqual(insertFeeds[2]!.tipUsers)

    await browserDB.transaction("rw", [browserDB.feeds], async (tx) => {
      await browserDB.upgradeToV8(tx)
    })
    const feedsAfterMigrate = await browserDB.feeds.toArray()
    expect(feedsAfterMigrate.length).toEqual(3)
    expect(feedsAfterMigrate[0]!.tipUsers).toEqual([])
    expect(feedsAfterMigrate[1]!.tipUsers).toEqual(null)
    expect(feedsAfterMigrate[2]!.tipUsers).toEqual([{ name: "user1" }])
  })
})
