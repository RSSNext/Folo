import type { FeedSchema } from "@follow/database/schemas/types"
import { FEED_EXTRA_DATA_KEYS, FeedService } from "@follow/database/services/feed"
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
        const data = Object.fromEntries(
          FEED_EXTRA_DATA_KEYS.filter((key) => (draft.feeds[feed.id] || {})[key]).map((key) => [
            key,
            draft.feeds[feed.id]?.[key],
          ]),
        )

        draft.feeds[feed.id] = {
          ...feed,
          ...data,
          type: "feed",
        }
      }
    })
  }

  async upsertMany(feeds: FeedSchema[]) {
    if (feeds.length === 0) return

    const tx = createTransaction()
    tx.store(() => {
      this.upsertManyInSession(feeds)
    })

    tx.persist(async () => {
      await FeedService.upsertMany(feeds.filter((feed) => !("nonce" in feed)))
    })

    await tx.run()
  }

  patchInSession(feedId: string, patch: Partial<FeedSchema>) {
    immerSet((state) => {
      const feed = state.feeds[feedId]
      if (!feed) return
      Object.assign(feed, patch)
    })
  }

  async patch(feedId: string, patch: Partial<FeedSchema>) {
    const tx = createTransaction()
    tx.store(() => {
      this.patchInSession(feedId, patch)
    })
    tx.persist(() => {
      return FeedService.patch(feedId, patch)
    })
    await tx.run()
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

    return {
      responseData: res.data,
      feed: finalData,
    }
  }

  async claimFeed(feedId: string) {
    const curFeed = get().feeds[feedId]
    if (!curFeed) return

    const tx = createTransaction()
    tx.store(() => {
      feedActions.patchInSession(feedId, {
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
      feedActions.patchInSession(feedId, {
        ownerUserId: curFeed.ownerUserId,
      })
    })

    await tx.run()
  }

  async fetchAnalytics(feedId: string | string[]) {
    const feedIds = Array.isArray(feedId) ? feedId : [feedId]
    const res = await apiClient().feeds.analytics.$post({
      json: {
        id: feedIds,
      },
    })

    const { analytics } = res.data

    for (const id of feedIds) {
      const feedAnalytics = analytics[id]
      if (feedAnalytics) {
        await feedActions.patch(id, {
          subscriptionCount: feedAnalytics.subscriptionCount,
          updatesPerWeek: feedAnalytics.updatesPerWeek,
          latestEntryPublishedAt: feedAnalytics.latestEntryPublishedAt,
        })
      }
    }

    return analytics
  }
}
export const feedSyncServices = new FeedSyncServices()
export const feedActions = new FeedActions()
