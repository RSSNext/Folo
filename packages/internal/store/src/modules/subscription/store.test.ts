import { FeedViewType } from "@follow/constants"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { apiContext } from "../../context"
import type { FollowAPI } from "../../types"
import { subscriptionSyncService, useSubscriptionStore } from "./store"
import type { SubscriptionModel } from "./types"

const mocks = vi.hoisted(() => ({
  batchUpdate: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  patchMany: vi.fn(),
}))

vi.mock("@follow/database/services/subscription", () => ({
  SubscriptionService: {
    patchMany: mocks.patchMany,
  },
}))

const createSubscription = (
  feedId: string,
  view: FeedViewType,
  category: string | null,
): SubscriptionModel => ({
  feedId,
  listId: null,
  inboxId: null,
  userId: "user",
  view,
  isPrivate: false,
  hideFromTimeline: null,
  title: null,
  category,
  createdAt: new Date(0).toISOString(),
  type: "feed",
})

const seed = (subscriptions: SubscriptionModel[]) => {
  const state = useSubscriptionStore.getState()
  const feedIdByView = Object.fromEntries(
    Object.keys(state.feedIdByView).map((view) => [view, new Set<string>()]),
  ) as Record<FeedViewType, Set<string>>
  const categories = Object.fromEntries(
    Object.keys(state.categories).map((view) => [view, new Set<string>()]),
  ) as Record<FeedViewType, Set<string>>

  for (const subscription of subscriptions) {
    feedIdByView[subscription.view].add(subscription.feedId!)
    feedIdByView[FeedViewType.All].add(subscription.feedId!)
    if (subscription.category) {
      categories[subscription.view].add(subscription.category)
      categories[FeedViewType.All].add(subscription.category)
    }
  }

  useSubscriptionStore.setState({
    data: Object.fromEntries(subscriptions.map((s) => [s.feedId!, s])),
    feedIdByView,
    categories,
  })
}

describe("subscriptionSyncService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.batchUpdate.mockResolvedValue({})
    mocks.updateCategory.mockResolvedValue({})
    mocks.deleteCategory.mockResolvedValue({})
    mocks.patchMany.mockResolvedValue(undefined)
    apiContext.provide({
      subscriptions: { batchUpdate: mocks.batchUpdate },
      categories: { update: mocks.updateCategory, delete: mocks.deleteCategory },
    } as unknown as FollowAPI)
  })

  test("takes feeds out of their category when the category is null", async () => {
    seed([
      createSubscription("a", FeedViewType.Articles, "Tech"),
      createSubscription("b", FeedViewType.Articles, "News"),
      createSubscription("c", FeedViewType.Articles, "News"),
    ])

    await subscriptionSyncService.batchUpdateSubscription({
      feedIds: ["a", "b"],
      category: null,
      view: FeedViewType.Articles,
    })

    const state = useSubscriptionStore.getState()
    expect(state.data.a!.category).toBeNull()
    expect(state.data.b!.category).toBeNull()
    expect(state.data.c!.category).toBe("News")
    expect([...state.categories[FeedViewType.Articles]]).toEqual(["News"])
  })

  test("keeps the category when only the view changes", async () => {
    seed([createSubscription("a", FeedViewType.Articles, "Tech")])

    await subscriptionSyncService.batchUpdateSubscription({
      feedIds: ["a"],
      view: FeedViewType.Pictures,
    })

    const state = useSubscriptionStore.getState()
    expect(state.data.a!.view).toBe(FeedViewType.Pictures)
    expect(state.data.a!.category).toBe("Tech")
  })

  test("renames a folder of the All view in every view it spans", async () => {
    seed([
      createSubscription("a", FeedViewType.Articles, "Tech"),
      createSubscription("b", FeedViewType.Pictures, "Tech"),
    ])

    await subscriptionSyncService.renameCategory({
      lastCategory: "Tech",
      newCategory: "Science",
      view: FeedViewType.All,
    })

    const state = useSubscriptionStore.getState()
    expect(state.data.a!.category).toBe("Science")
    expect(state.data.b!.category).toBe("Science")
    expect([...state.categories[FeedViewType.Articles]]).toEqual(["Science"])
    expect([...state.categories[FeedViewType.Pictures]]).toEqual(["Science"])
    expect(mocks.updateCategory).toHaveBeenCalledWith({
      feedIdList: ["a", "b"],
      category: "Science",
    })
  })
})
