import type { FeedSchema } from "@follow/database/schemas/types"
import { FeedService } from "@follow/database/services/feed"
import { isBizId } from "@follow/utils"

import { apiClient } from "../context"
import type { Hydratable, Resetable } from "../internal/base"
import { createImmerSetter, createTransaction, createZustandStore } from "../internal/helper"
import { whoami } from "../user/getters"
import type { FeedModel } from "./types"

interface FeedState {
  feeds: Record<string, FeedModel>
}

const initialFeedStore: FeedState = {
  feeds: {},
}

export const useFeedStore = createZustandStore<FeedState>("feed")(() => initialFeedStore)

const get = useFeedStore.getState
const set = useFeedStore.setState
const immerSet = createImmerSetter(useFeedStore)
// const get = useFeedStore.getState
// const distanceTime = 1000 * 60 * 60 * 9
class FeedActions implements Hydratable, Resetable {
  async hydrate() {
    const feeds = await FeedService.getFeedAll()
    feedActions.upsertManyInSession(feeds)
  }

  upsertManyInSession(feeds: FeedSchema[]) {
    immerSet((draft) => {
      for (const feed of feeds) {
        draft.feeds[feed.id] = {
          ...feed,
          type: "feed",
        }
      }
    })
  }

  upsertMany(feeds: FeedSchema[]) {
    if (feeds.length === 0) return

    const tx = createTransaction()
    tx.store(() => {
      this.upsertManyInSession(feeds)
    })

    tx.persist(async () => {
      await FeedService.upsertMany(feeds.filter((feed) => !("nonce" in feed)))
    })

    tx.run()
  }

  patch(feedId: string, patch: Partial<FeedSchema>) {
    immerSet((state) => {
      const feed = state.feeds[feedId]
      if (!feed) return
      Object.assign(feed, patch)
    })
  }

  async reset() {
    const tx = createTransaction()
    tx.store(() => {
      set(initialFeedStore)
    })

    tx.persist(() => {
      return FeedService.reset()
    })

    await tx.run()
  }
}

type FeedQueryParams = {
  id?: string
  url?: string
}

class FeedSyncServices {
  async fetchFeedById({ id, url }: FeedQueryParams) {
    const isFeedId = isBizId(id)
    if (!url && !isFeedId) {
      return null
    }

    const res = await apiClient().feeds.$get({
      query: {
        id,
        url,
      },
    })

    const nonce = Math.random().toString(36).slice(2, 15)

    const finalData = {
      ...res.data.feed,
      updatesPerWeek: res.data.analytics?.updatesPerWeek,
      subscriptionCount: res.data.analytics?.subscriptionCount,
      latestEntryPublishedAt: res.data.analytics?.latestEntryPublishedAt,
    } as FeedModel
    if (!finalData.id) {
      finalData["nonce"] = nonce
    }
    feedActions.upsertMany([finalData])

    const feed = !finalData.id ? { ...finalData, id: nonce } : finalData
    return {
      ...res.data,
      ...feed,
    }
  }

  async fetchFeedByUrl({ url }: FeedQueryParams) {
    const res = await apiClient().feeds.$get({
      query: {
        url,
      },
    })

    const nonce = Math.random().toString(36).slice(2, 15)

    const finalData = {
      ...res.data.feed,
      updatesPerWeek: res.data.analytics?.updatesPerWeek,
      subscriptionCount: res.data.analytics?.subscriptionCount,
      latestEntryPublishedAt: res.data.analytics?.latestEntryPublishedAt,
    } as FeedModel
    if (!finalData.id) {
      finalData["nonce"] = nonce
      finalData["id"] = nonce
    }
    feedActions.upsertMany([finalData])

    return finalData
  }

  async claimFeed(feedId: string) {
    const curFeed = get().feeds[feedId]
    if (!curFeed) return

    const tx = createTransaction()
    tx.store(() => {
      feedActions.patch(feedId, {
        ownerUserId: whoami()?.id || null,
      })
    })

    tx.request(async () => {
      await apiClient().feeds.claim.challenge.$post({
        json: {
          feedId,
        },
      })
    })

    tx.persist(() => {
      const newFeed = get().feeds[feedId]
      if (!newFeed) return
      return FeedService.upsertMany([newFeed])
    })

    tx.rollback(() => {
      feedActions.patch(feedId, {
        ownerUserId: curFeed.ownerUserId,
      })
    })

    await tx.run()
  }
}
export const feedSyncServices = new FeedSyncServices()
export const feedActions = new FeedActions()
