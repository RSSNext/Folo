import type { FeedSchema, InboxSchema } from "@follow/database/schemas/types"
import type {
  EntryListResponse,
  EntryWithFeed,
  ExtractResponseData,
  FeedViewType,
  InboxListEntry,
  InboxListEntryResponse,
  InboxSubscriptionResponse,
  ListSubscriptionResponse,
  SubscriptionWithFeed,
} from "@follow-app/client-sdk"

import type { CollectionModel } from "../modules/collection/types"
import type { EntryModel } from "../modules/entry/types"
import type { FeedModel } from "../modules/feed/types"
import type { ListModel } from "../modules/list/types"
import type { SubscriptionModel } from "../modules/subscription/types"

class APIMorph {
  toSubscription(
    data: (SubscriptionWithFeed | ListSubscriptionResponse | InboxSubscriptionResponse)[],
  ) {
    const subscriptions: SubscriptionModel[] = []

    const collections = {
      feeds: [],
      inboxes: [],
      lists: [],
    } as {
      feeds: FeedSchema[]
      inboxes: InboxSchema[]
      lists: ListModel[]
    }

    for (const item of data) {
      const baseSubscription = {
        category: item.category!,

        userId: item.userId,
        view: item.view,
        isPrivate: item.isPrivate,
        hideFromTimeline: item.hideFromTimeline,
        title: item.title,
        createdAt: item.createdAt,
      } as SubscriptionModel

      if ("feeds" in item) {
        baseSubscription.feedId = item.feedId
        baseSubscription.type = "feed"
        const feed = item.feeds
        collections.feeds.push({
          description: feed.description!,
          id: feed.id,
          errorAt: feed.errorAt!,
          errorMessage: feed.errorMessage!,
          image: feed.image!,
          ownerUserId: feed.ownerUserId!,
          siteUrl: feed.siteUrl!,
          title: feed.title!,
          url: feed.url,
        })
      }

      if ("inboxes" in item) {
        baseSubscription.inboxId = item.inboxId
        baseSubscription.type = "inbox"
        const inbox = item.inboxes

        collections.inboxes.push({
          id: inbox.id,
          title: inbox.title,
          secret: inbox.secret,
        })
      }

      if ("lists" in item) {
        baseSubscription.listId = item.listId
        baseSubscription.type = "list"
        const list = item.lists
        if (list.owner)
          collections.lists.push({
            id: list.id,
            title: list.title!,
            userId: list.owner!.id,
            description: list.description!,
            view: list.view,
            image: list.image!,
            ownerUserId: list.owner.id,
            feedIds: list.feedIds!,
            fee: list.fee!,
            subscriptionCount: null,
            purchaseAmount: null,
            type: "list",
          })
      }

      subscriptions.push(baseSubscription)
    }
    return { subscriptions, collections }
  }

  toCollections(
    data: ExtractResponseData<InboxListEntryResponse | EntryListResponse>,
    view: FeedViewType,
  ): {
    collections: CollectionModel[]
    entryIdsNotInCollections: string[]
  } {
    if (!data) return { collections: [], entryIdsNotInCollections: [] }

    const collections: CollectionModel[] = []
    const entryIdsNotInCollections: string[] = []
    for (const item of data) {
      if (!("collections" in item)) {
        entryIdsNotInCollections.push((item as EntryWithFeed).entries.id)
        continue
      }
      if (item.collections)
        collections.push({
          createdAt: item.collections.createdAt,
          entryId: item.entries.id,
          feedId: item.feeds.id,
          view,
        })
    }

    return {
      collections,
      entryIdsNotInCollections,
    }
  }

  toEntryList(data?: InboxListEntry[] | EntryWithFeed[]): EntryModel[] {
    const entries: EntryModel[] = []
    for (const item of data ?? []) {
      entries.push({
        id: item.entries.id,
        title: item.entries.title,
        url: item.entries.url,
        content: null,
        readabilityContent: null,
        description: item.entries.description,
        guid: item.entries.guid,
        author: item.entries.author,
        authorUrl: item.entries.authorUrl,
        authorAvatar: item.entries.authorAvatar,
        insertedAt: new Date(item.entries.insertedAt),
        publishedAt: new Date(item.entries.publishedAt),
        media: item.entries.media ?? null,
        categories: item.entries.categories ?? null,
        attachments: item.entries.attachments ?? null,
        extra: item.entries.extra
          ? {
              links: item.entries.extra.links ?? undefined,
            }
          : null,
        language: item.entries.language,
        feedId: item.feeds.id,
        inboxHandle: item.feeds.type === "inbox" ? item.feeds.id : null,
        read: item.read,
        sources: "from" in item ? (item.from ?? null) : null,
        settings: item.settings ?? null,
      })
    }
    return entries
  }

  toFeed(data: EntryWithFeed["feeds"]): FeedModel {
    return {
      type: "feed",
      id: data.id,
      title: data.title,
      url: data.url,
      image: data.image,
      description: data.description,
      ownerUserId: data.ownerUserId,
      errorAt: data.errorAt,
      errorMessage: data.errorMessage,
      siteUrl: data.siteUrl,
      tipUserIds: data.tipUsers ? data.tipUsers.map((user) => user.id) : [],
    }
  }
}
export const apiMorph = new APIMorph()
