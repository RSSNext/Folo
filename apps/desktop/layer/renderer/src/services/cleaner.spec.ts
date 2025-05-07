// @ts-nocheck
import type { EntryModel } from "@follow/models/types"
import type { TargetModel } from "@follow/shared/hono"
import { beforeAll, describe, expect, test } from "vitest"

import { browserDB } from "~/database"
import type { SubscriptionFlatModel } from "~/store/subscription"

import { CleanerService } from "./cleaner"
import { EntryService } from "./entry"
import { FeedService } from "./feed"
import { SubscriptionService } from "./subscription"

const currentUserID = "test-user-id"
const otherUserIDs = ["test-user-id-1", "test-user-id-2", "test-user-id-3"]

const subscriptions: SubscriptionFlatModel[] = [
  {
    feedId: "feed-id-1",
    userId: currentUserID,
  },
  {
    feedId: "feed-id-2",
    userId: currentUserID,
  },
  {
    feedId: "feed-id-3",
    userId: otherUserIDs[0],
  },
  {
    feedId: "feed-id-4",
    userId: otherUserIDs[1],
  },
  {
    feedId: "feed-id-5",
    userId: otherUserIDs[2],
  },
  // ====
  {
    feedId: "feed-id-1",
    userId: otherUserIDs[0],
  },
]

const feeds: TargetModel[] = [
  {
    id: "feed-id-1",
  },
  {
    id: "feed-id-2",
  },
  {
    id: "feed-id-3",
  },
  {
    id: "feed-id-4",
  },
  {
    id: "feed-id-5",
  },
]

const entries: EntryModel[] = [
  {
    id: "entry-id-1",
  },
  {
    id: "entry-id-2",
  },
  {
    id: "entry-id-3",
  },
  {
    id: "entry-id-4",
  },
  {
    id: "entry-id-5",
  },
  {
    id: "entry-id-6",
  },
]

const entryFeedIdMap = {
  "entry-id-1": "feed-id-1",
  "entry-id-2": "feed-id-2",
  "entry-id-3": "feed-id-3",
  "entry-id-4": "feed-id-4",
  "entry-id-5": "feed-id-5",
  "entry-id-6": "feed-id-1",
}
describe("test db cleaner", () => {
  beforeAll(async () => {
    await browserDB.delete()
  })
  beforeAll(async () => {
    await browserDB.open()
    await SubscriptionService.upsertMany(subscriptions)
    await FeedService.upsertMany(feeds)
    await EntryService.upsertMany(entries, entryFeedIdMap)
  })

  test("data should be set up correctly", async () => {
    const feeds = await FeedService.findAll()
    const entries = await EntryService.findAll()
    const subscriptions = await SubscriptionService.findAll()
    expect(feeds).toMatchSnapshot()
    expect(entries).toMatchSnapshot()
    expect(subscriptions).toMatchSnapshot()
  })
  test("should clean remaining data", async () => {
    await CleanerService.cleanRemainingData(currentUserID)

    const feeds = await FeedService.findAll()
    expect(feeds).toMatchInlineSnapshot(`
      [
        {
          "id": "feed-id-1",
        },
        {
          "id": "feed-id-2",
        },
      ]
    `)
    const subscripions = await SubscriptionService.findAll()
    expect(subscripions).toMatchInlineSnapshot(`
      [
        {
          "feedId": "feed-id-1",
          "id": "test-user-id/feed-id-1",
          "userId": "test-user-id",
        },
        {
          "feedId": "feed-id-2",
          "id": "test-user-id/feed-id-2",
          "userId": "test-user-id",
        },
      ]
    `)
    const entries = await EntryService.findAll()
    expect(entries).toMatchInlineSnapshot(`
      [
        {
          "feedId": "feed-id-1",
          "id": "entry-id-1",
        },
        {
          "feedId": "feed-id-2",
          "id": "entry-id-2",
        },
        {
          "feedId": "feed-id-1",
          "id": "entry-id-6",
        },
      ]
    `)
  })
})
