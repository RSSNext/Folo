import type { FeedModel, FeedOrListRespModel } from "@follow/models"

import type { useInboxStore } from "../inbox"
import type { useListStore } from "../list"
import type { useFeedStore } from "./store"
import type { FeedQueryParams } from "./types"

type FeedState = ReturnType<typeof useFeedStore.getState>
type ListState = ReturnType<typeof useListStore.getState>
type InboxState = ReturnType<typeof useInboxStore.getState>

export const feedIconSelector = (feed: FeedModel) => {
  return {
    type: feed.type,
    ownerUserId: feed.ownerUserId,
    id: feed.id,
    title: feed.title,
    url: (feed as any).url || "",
    image: feed.image,
    siteUrl: feed.siteUrl,
  }
}

export const feedByIdSelector = (feedId: Nullable<string>) => (state: FeedState) =>
  feedId ? state.feeds[feedId] : null

export const feedByIdWithTransformSelector =
  <T>(feedId: Nullable<string>, transform: (feed: FeedModel) => T) =>
  (state: FeedState) => {
    const feed = feedId ? state.feeds[feedId] : null
    return transform ? feed && transform(feed) : feed
  }

export const feedByIdOrUrlSelector = (feed: FeedQueryParams) => (state: FeedState) => {
  if (feed.id) {
    return state.feeds[feed.id]
  }
  if (feed.url) {
    return Object.values(state.feeds).find((f) => f.type === "feed" && f.url === feed.url) || null
  }
  return null
}

export const feedByIdSelectorWithTransform =
  <T>(feedId: Nullable<string>, selector: (feed: FeedOrListRespModel) => T) =>
  (state: FeedState) =>
    feedId && state.feeds[feedId] ? selector(state.feeds[feedId]) : null

export const listByIdSelectorWithTransform =
  <T>(listId: Nullable<string>, selector: (list: any) => T) =>
  (state: ListState) =>
    listId && state.lists[listId] ? selector(state.lists[listId]) : null

export const inboxByIdSelectorWithTransform =
  <T>(inboxId: Nullable<string>, selector: (inbox: any) => T) =>
  (state: InboxState) =>
    inboxId && state.inboxes[inboxId] ? selector(state.inboxes[inboxId]) : null
