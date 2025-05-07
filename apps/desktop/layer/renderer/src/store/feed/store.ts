import type {
  CombinedEntryModel,
  FeedModel,
  FeedOrListRespModel,
  UserModel,
} from "@follow/models/types"
import { produce } from "immer"
import { nanoid } from "nanoid"

import { whoami } from "~/atoms/user"
import { runTransactionInScope } from "~/database"
import { apiClient } from "~/lib/api-fetch"
import { FeedService } from "~/services"

import { getSubscriptionByFeedId } from "../subscription"
import { userActions } from "../user"
import { createImmerSetter, createTransaction, createZustandStore } from "../utils/helper"
import type { FeedQueryParams, FeedState } from "./types"

export const useFeedStore = createZustandStore<FeedState>("feed")(() => ({
  feeds: {},
}))

const set = useFeedStore.setState
const immerSet = createImmerSetter(useFeedStore)
const get = useFeedStore.getState
const distanceTime = 1000 * 60 * 60 * 9
class FeedActions {
  clear() {
    set({ feeds: {} })
  }

  async upsertMany(feeds: FeedModel[]) {
    const tx = createTransaction()

    tx.optimistic(() => {
      immerSet((state) => {
        for (const feed of feeds) {
          if (feed.errorAt && new Date(feed.errorAt).getTime() > Date.now() - distanceTime) {
            feed.errorAt = null
          }
          if (feed.id) {
            if (feed.owner) {
              userActions.upsert(feed.owner as UserModel)
            }
            if (feed.tipUsers) {
              userActions.upsert(feed.tipUsers)
            }

            // Not all API return these fields, so merging is needed here.
            const targetFeed = state.feeds[feed.id]

            if (targetFeed?.owner) {
              feed.owner = { ...targetFeed.owner }
            }
            if (
              targetFeed &&
              "tipUsers" in targetFeed &&
              targetFeed.tipUsers &&
              // Workaround for type issue
              Array.isArray(targetFeed.tipUsers)
            ) {
              feed.tipUsers = [...targetFeed.tipUsers]
            }

            // @ts-expect-error
            const { feeds, ...nextFeeds } = feed
            state.feeds[feed.id] = nextFeeds as FeedModel
          } else {
            // Store temp feed in memory
            const nonce = feed["nonce"] || nanoid(8)
            state.feeds[nonce] = { ...feed, id: nonce }
          }
        }
      })
    })
    tx.persist(() => {
      FeedService.upsertMany(feeds)
    })
    await tx.run()
  }

  private patch(feedId: string, patch: Partial<FeedOrListRespModel>) {
    set((state) =>
      produce(state, (state) => {
        const feed = state.feeds[feedId]
        if (!feed) return

        Object.assign(feed, patch)
      }),
    )
  }

  updateFeedOwnership(feedId: string, ownerUserId: string | null) {
    this.patch(feedId, {
      ownerUserId,
    })
  }

  async claimFeed(feedId: string) {
    await apiClient.feeds.claim.challenge.$post({
      json: {
        feedId,
      },
    })
    runTransactionInScope(async () => {
      const currentUser = whoami()
      if (!currentUser) return
      this.updateFeedOwnership(feedId, currentUser.id)
      const feed = get().feeds[feedId]
      if (!feed) return
      await FeedService.upsert(feed)
    })
  }

  // API Fetcher
  //

  async fetchFeedById({ id, url }: FeedQueryParams) {
    const res = await apiClient.feeds.$get({
      query: {
        id,
        url,
      },
    })

    const nonce = nanoid(8)

    const finalData = res.data.feed
    if (!finalData.id) {
      finalData["nonce"] = nonce
    }
    this.upsertMany([finalData])

    return {
      ...res.data,
      feed: !finalData.id ? { ...finalData, id: nonce } : finalData,
    }
  }
}
export const feedActions = new FeedActions()

export const getFeedById = (feedId: string): Nullable<FeedOrListRespModel> =>
  useFeedStore.getState().feeds[feedId]

export const getPreferredTitle = (
  feed?: Pick<FeedOrListRespModel, "type" | "id" | "title"> | null,
  entry?: Pick<CombinedEntryModel["entries"], "authorUrl"> | null,
) => {
  if (!feed?.id) {
    return feed?.title
  }

  if (feed.type === "inbox") {
    if (entry?.authorUrl) return entry.authorUrl.replace(/^mailto:/, "")
    return feed.title || `${feed.id.slice(0, 1).toUpperCase()}${feed.id.slice(1)}'s Inbox`
  }

  const subscription = getSubscriptionByFeedId(feed.id)
  return subscription?.title || feed.title
}
