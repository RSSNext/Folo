import type { FeedSchema } from "@follow/database/schemas/types"
import { FEED_EXTRA_DATA_KEYS, FeedService } from "@follow/database/services/feed"
import { SyncMetaService } from "@follow/database/services/sync-meta"
import { getDateISOString, isBizId } from "@follow/utils"

import { api } from "../../context"
import type { Hydratable, Resetable } from "../../lib/base"
import { createImmerSetter, createTransaction, createZustandStore } from "../../lib/helper"
import { whoami } from "../user/getters"
import type { FeedModel } from "./types"

export interface FeedState {
  feeds: Record<string, FeedModel>
  /**
   * The URL of the feed an address was looked up as, keyed by that address where they differ.
   * The server keeps the feed of an RSSHub instance address such as
   * http://localhost:1200/test/sort as rsshub://test/sort.
   */
  resolvedUrls: Record<string, string>
}

const initialFeedStore: FeedState = {
  feeds: {},
  resolvedUrls: {},
}

export const useFeedStore = createZustandStore<FeedState>("feed")(() => initialFeedStore)

const get = useFeedStore.getState
const set = useFeedStore.setState
const immerSet = createImmerSetter(useFeedStore)

// The server fetches a feed it has not stored yet and gives its source 70 s before it answers
// with an error that says so. A shorter timeout here would replace that answer with its own.
const FEED_LOOKUP_TIMEOUT_MS = 90_000

/**
 * The resolved URLs are kept across launches, so a feed followed by an RSSHub instance address
 * is still found by it. The table belongs to the signed-in account and is cleared with it.
 */
const RESOLVED_URLS_KEY = "feed:resolved-urls"
// Only the most recently resolved addresses are kept
const MAX_RESOLVED_URLS = 100

const readResolvedUrls = async (): Promise<Record<string, string>> => {
  try {
    const stored = await SyncMetaService.get(RESOLVED_URLS_KEY)
    if (!stored) return {}
    const parsed: unknown = JSON.parse(stored)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    )
  } catch (error) {
    console.error("[feed] failed to load the resolved URLs", error)
    return {}
  }
}
// const get = useFeedStore.getState
// const distanceTime = 1000 * 60 * 60 * 9

/**
 * The keys of the stored previews that incoming feeds replace. A feed the server has not stored
 * yet is previewed under a nonce id, and the feed fetched or followed later for its URL takes its
 * place, so the nonce is neither found nor sent once the real feed is known.
 */
const getReplacedPreviewIds = (stored: Record<string, FeedModel>, incoming: FeedSchema[]) => {
  const previewIds = Object.keys(stored).filter((id) => stored[id]?.nonce)
  if (previewIds.length === 0) return previewIds

  const incomingIdByUrl = new Map(incoming.map((feed) => [feed.url, feed.id]))
  return previewIds.filter((id) => {
    const incomingId = incomingIdByUrl.get(stored[id]!.url)
    return incomingId !== undefined && incomingId !== id
  })
}

class FeedActions implements Hydratable, Resetable {
  async hydrate() {
    const [feeds, resolvedUrls] = await Promise.all([FeedService.getFeedAll(), readResolvedUrls()])
    feedActions.upsertManyInSession(feeds)
    immerSet((draft) => {
      // Addresses already looked up in this session are the newer ones
      draft.resolvedUrls = { ...resolvedUrls, ...draft.resolvedUrls }
    })
  }

  upsertManyInSession(feeds: FeedSchema[]) {
    const replacedPreviewIds = getReplacedPreviewIds(get().feeds, feeds)
    immerSet((draft) => {
      for (const id of replacedPreviewIds) {
        delete draft.feeds[id]
      }
      for (const feed of feeds) {
        // Feeds from subscriptions carry no analytics, so keep the stored ones for keys the
        // incoming feed leaves empty, but let a fresh fetch replace them
        const data = Object.fromEntries(
          FEED_EXTRA_DATA_KEYS.filter(
            (key) => feed[key] == null && (draft.feeds[feed.id] || {})[key],
          ).map((key) => [key, draft.feeds[feed.id]?.[key]]),
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

  /** Remember the URL of the feed the server found for an address, also for later launches */
  async setResolvedUrl(address: string | undefined, feedUrl: string | undefined) {
    if (!address || !feedUrl || address === feedUrl) return
    if (get().resolvedUrls[address] === feedUrl) return
    immerSet((draft) => {
      // The latest address goes last, so the oldest ones are dropped first
      delete draft.resolvedUrls[address]
      draft.resolvedUrls[address] = feedUrl
      const addresses = Object.keys(draft.resolvedUrls)
      for (const stale of addresses.slice(0, Math.max(0, addresses.length - MAX_RESOLVED_URLS))) {
        delete draft.resolvedUrls[stale]
      }
    })

    await SyncMetaService.set(RESOLVED_URLS_KEY, JSON.stringify(get().resolvedUrls)).catch(
      (error) => {
        console.error("[feed] failed to store the resolved URLs", error)
      },
    )
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

    tx.persist(async () => {
      await Promise.all([
        FeedService.reset(),
        SyncMetaService.delete(RESOLVED_URLS_KEY).catch((error) => {
          console.error("[feed] failed to clear the resolved URLs", error)
        }),
      ])
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

    const res = await api().feeds.get({
      id,
      url,
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
    const res = await api().feeds.get({ url }, { timeout: FEED_LOOKUP_TIMEOUT_MS })

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
    void feedActions.setResolvedUrl(url, finalData.url)

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
      await api().feeds.claim.challenge({
        feedId,
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
    const res = await api().feeds.analytics({
      id: feedIds,
    })

    const { analytics } = res.data

    for (const id of feedIds) {
      const feedAnalytics = analytics[id]
      if (feedAnalytics) {
        await feedActions.patch(id, {
          subscriptionCount: feedAnalytics.subscriptionCount,
          updatesPerWeek: feedAnalytics.updatesPerWeek,
          latestEntryPublishedAt: getDateISOString(feedAnalytics.latestEntryPublishedAt),
        })
      }
    }

    return analytics
  }
}
export const feedSyncServices = new FeedSyncServices()
export const feedActions = new FeedActions()
