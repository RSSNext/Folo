import type {
  InboxSubscriptionResponse,
  ListSubscriptionResponse,
  SubscriptionWithFeed,
} from "@follow-app/client-sdk"

/** A row of GET /subscriptions: a feed, a list or an inbox the user follows */
export type AnySubscription =
  SubscriptionWithFeed | ListSubscriptionResponse | InboxSubscriptionResponse

export const isInboxSubscription = (value: AnySubscription): value is InboxSubscriptionResponse => {
  return "inboxes" in value
}

export const isListSubscription = (value: AnySubscription): value is ListSubscriptionResponse => {
  return "lists" in value
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
