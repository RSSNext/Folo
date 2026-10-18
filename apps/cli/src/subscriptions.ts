import type {
  FollowClient,
  InboxSubscriptionResponse,
  ListSubscriptionResponse,
  SubscriptionWithFeed,
} from "@follow-app/client-sdk"
import { FollowAPIError } from "@follow-app/client-sdk"

import { CLIError } from "./output"

/** A row of GET /subscriptions: a feed, a list or an inbox the user follows */
export type AnySubscription =
  SubscriptionWithFeed | ListSubscriptionResponse | InboxSubscriptionResponse

export const isInboxSubscription = (value: AnySubscription): value is InboxSubscriptionResponse => {
  return "inboxes" in value
}

export const isListSubscription = (value: AnySubscription): value is ListSubscriptionResponse => {
  return "lists" in value
}

export const isFeedSubscription = (value: AnySubscription): value is SubscriptionWithFeed => {
  return !isInboxSubscription(value) && !isListSubscription(value)
}

/** The title the user gave the subscription, or the title of what it follows */
export const getSubscriptionTitle = (value: AnySubscription): string | null => {
  if (value.title) {
    return value.title
  }
  if (isInboxSubscription(value)) {
    return value.inboxes.title ?? null
  }
  if (isListSubscription(value)) {
    return value.lists.title ?? null
  }
  return value.feeds.title ?? null
}

/** The feed the API stores for a URL, or null when it has none */
const resolveFeed = async (client: FollowClient, url: string) => {
  try {
    const response = await client.api.feeds.get({ url })
    return response.data.feed
  } catch (error) {
    // The API answers a URL without a feed with 404, or 400 when nothing could be fetched or
    // parsed there. A timeout or a server error says nothing about the feed, so it is reported
    // instead of a NOT_FOUND that would tell the user they don't follow it.
    if (error instanceof FollowAPIError && (error.status === 400 || error.status === 404)) {
      return null
    }
    throw error
  }
}

/** What an id or URL given to `subscription update` or `remove` names */
export type SubscriptionTarget = "feed" | "list" | "url"

const describeTarget = (value: string, target: SubscriptionTarget) => {
  switch (target) {
    case "list": {
      return `a list with id ${value}`
    }
    case "url": {
      return `a feed at ${value}`
    }
    default: {
      return `a feed or list with id ${value}`
    }
  }
}

/**
 * The feed or list subscription an id or URL names. The API answers an update or removal of
 * something the user does not follow with success, and records it as a change for the user's
 * other devices to sync, so the CLI looks it up first. A list's id works as a feed id, as the
 * API accepts it in feedId; inboxes are not changed through subscriptions.
 */
export const findSubscription = async (
  client: FollowClient,
  value: string,
  target: SubscriptionTarget,
): Promise<SubscriptionWithFeed | ListSubscriptionResponse> => {
  const { data } = await client.api.subscriptions.get({})
  let subscription = data.find((item) => {
    if (target === "list") {
      return isListSubscription(item) && item.listId === value
    }
    if (target === "url") {
      return isFeedSubscription(item) && item.feeds.url === value
    }
    // A list subscription's feedId is its list's id
    return !isInboxSubscription(item) && item.feedId === value
  })

  // The API stores the feeds of RSSHub instances as rsshub:// URLs, so the URL a feed was
  // followed with, such as https://rsshub.app/..., is not the one listed. It knows which one.
  if (!subscription && target === "url") {
    const feed = await resolveFeed(client, value)
    subscription = feed?.id
      ? data.find((item) => isFeedSubscription(item) && item.feedId === feed.id)
      : undefined
  }

  if (!subscription || isInboxSubscription(subscription)) {
    throw new CLIError("NOT_FOUND", `You don't follow ${describeTarget(value, target)}.`)
  }
  return subscription
}
