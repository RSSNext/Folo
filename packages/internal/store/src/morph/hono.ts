import type { EntryModel } from "../entry/types"
import type { FeedModel } from "../feed/types"
import type { ListModel } from "../list/types"
import type { MeModel } from "../user/store"
import type { HonoApiClient } from "./types"

/**
 * @deprecated
 */
class LegacyHonoMorph {
  toList(data: HonoApiClient.List_Get["list"] | HonoApiClient.List_List_Get): ListModel {
    return {
      id: data.id,
      title: data.title!,
      userId: data.ownerUserId!,
      description: data.description!,
      view: data.view,
      image: data.image!,
      ownerUserId: data.ownerUserId!,
      feedIds: data.feedIds!,
      fee: data.fee!,
      subscriptionCount: "subscriptionCount" in data ? data.subscriptionCount : null,
      purchaseAmount:
        "purchaseAmount" in data && data.purchaseAmount !== null
          ? String(data.purchaseAmount)
          : null,
      type: "list",
    }
  }

  toEntry(data?: HonoApiClient.Entry_Get | HonoApiClient.Entry_Inbox_Get): EntryModel | null {
    if (!data) return null

    return {
      id: data.entries.id,
      title: data.entries.title,
      url: data.entries.url,
      content: data.entries.content,
      readabilityContent: null,
      description: data.entries.description,
      guid: data.entries.guid,
      author: data.entries.author,
      authorUrl: data.entries.authorUrl,
      authorAvatar: data.entries.authorAvatar,
      insertedAt: new Date(data.entries.insertedAt),
      publishedAt: new Date(data.entries.publishedAt),
      media: data.entries.media ?? null,
      categories: data.entries.categories ?? null,
      attachments: data.entries.attachments ?? null,
      extra: data.entries.extra
        ? {
            links: data.entries.extra.links ?? undefined,
          }
        : null,
      language: data.entries.language,
      feedId: data.feeds.id,
      inboxHandle: data.feeds.type === "inbox" ? data.feeds.id : null,
      read: false,
      sources: null,
      settings: null,
    }
  }

  toFeed(data: HonoApiClient.Feed_Get["feed"]): FeedModel {
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

  toUser(data: HonoApiClient.User_Get, isMe?: boolean): MeModel {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      handle: data.handle,
      image: data.image,
      isMe: isMe ?? false,
      emailVerified: data.emailVerified,
      twoFactorEnabled: data.twoFactorEnabled,
      bio: data.bio,
      website: data.website,
      socialLinks: data.socialLinks,
    }
  }
}
/**
 * @deprecated
 */
export const honoMorph = new LegacyHonoMorph()
