import type { FeedSchema } from "@follow/database/schemas/types"
import { FeedService } from "@follow/database/services/feed"

import { apiClient } from "../context"
import type { Hydratable } from "../internal/base"
import { createImmerSetter, createTransaction, createZustandStore } from "../internal/helper"
import type { FeedModel } from "./types"

interface FeedState {
  feeds: Record<string, FeedModel>
}

export const useFeedStore = createZustandStore<FeedState>("feed")(() => ({
  feeds: {},
}))

const set = useFeedStore.setState
const immerSet = createImmerSetter(useFeedStore)
// const get = useFeedStore.getState
// const distanceTime = 1000 * 60 * 60 * 9
class FeedActions implements Hydratable {
  async hydrate() {
    const feeds = await FeedService.getFeedAll()
    feedActions.upsertManyInSession(feeds)
  }

  clear() {
    set({ feeds: {} })
  }

  upsertManyInSession(feeds: FeedSchema[]) {
    immerSet((draft) => {
      for (const feed of feeds) {
        draft.feeds[feed.id] = feed
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

  private patch(feedId: string, patch: Partial<FeedSchema>) {
    immerSet((state) => {
      const feed = state.feeds[feedId]
      if (!feed) return
      Object.assign(feed, patch)
    })
  }
}

type FeedQueryParams = {
  id?: string
  url?: string
}

class FeedSyncServices {
  async fetchFeedById({ id, url }: FeedQueryParams) {
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

    return !finalData.id ? { ...finalData, id: nonce } : finalData
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
}
export const feedSyncServices = new FeedSyncServices()
export const feedActions = new FeedActions()
