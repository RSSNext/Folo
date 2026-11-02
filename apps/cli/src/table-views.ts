import type {
  DiscoveryItem,
  EntryWithFeed,
  ListWithStats,
  TrendingFeedItem,
} from "@follow-app/client-sdk"

import type { AnySubscription } from "./subscriptions"
import { getSubscriptionTitle, isInboxSubscription, isListSubscription } from "./subscriptions"

// What the table format shows of a list: the fields that tell its items apart, one row each

export const toEntryRow = (item: EntryWithFeed) => ({
  id: item.entries.id,
  // Posts of social media and pictures often have no title
  title: item.entries.title || item.entries.description || null,
  feed: item.feeds.title ?? null,
  publishedAt: item.entries.publishedAt,
  read: item.read,
})

export const toCollectionRow = (item: EntryWithFeed) => ({
  ...toEntryRow(item),
  collectedAt: item.collections?.createdAt ?? null,
})

export const toSubscriptionRow = (item: AnySubscription) => {
  const [type, id] = isInboxSubscription(item)
    ? ["inbox", item.inboxId]
    : isListSubscription(item)
      ? ["list", item.listId]
      : ["feed", item.feedId]

  return {
    type,
    id,
    title: getSubscriptionTitle(item),
    category: item.category ?? null,
    view: item.view,
    private: item.isPrivate,
  }
}

export const toListRow = (item: ListWithStats) => ({
  id: item.id,
  title: item.title ?? null,
  view: item.view,
  fee: item.fee,
  feeds: item.feedIds.length,
  subscribers: item.subscriptionCount ?? null,
})

export const toDiscoveryRow = (item: DiscoveryItem) => {
  const target = item.feed ?? item.list
  return {
    type: target?.type ?? null,
    id: target?.id ?? null,
    title: target?.title ?? null,
    url: item.feed?.url ?? item.docs ?? null,
    subscribers: item.subscriptionCount ?? null,
  }
}

export const toTrendingRow = (item: TrendingFeedItem) => ({
  id: item.feedId,
  title: item.feed.title ?? null,
  url: item.feed.url,
  subscribers: item.analytics?.subscriptionCount ?? null,
  updatesPerWeek: item.analytics?.updatesPerWeek ?? null,
})
