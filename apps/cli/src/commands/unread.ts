import type {
  InboxSubscriptionResponse,
  ListSubscriptionResponse,
  SubscriptionWithFeed,
} from "@follow-app/client-sdk"
import type { Command } from "commander"

import { parseView, viewHelp } from "../args"
import { runCommand } from "../command"

interface UnreadListOptions {
  view?: number
}

const isInboxSubscription = (
  value: SubscriptionWithFeed | ListSubscriptionResponse | InboxSubscriptionResponse,
): value is InboxSubscriptionResponse => {
  return "inboxes" in value
}

const isListSubscription = (
  value: SubscriptionWithFeed | ListSubscriptionResponse | InboxSubscriptionResponse,
): value is ListSubscriptionResponse => {
  return "lists" in value
}

const resolveTitle = (
  value: SubscriptionWithFeed | ListSubscriptionResponse | InboxSubscriptionResponse,
): string | null => {
  if (value.title) {
    return value.title
  }
  if ("feeds" in value) {
    return value.feeds.title ?? null
  }
  if ("lists" in value) {
    return value.lists.title ?? null
  }
  if ("inboxes" in value) {
    return value.inboxes.title ?? null
  }
  return null
}

export const registerUnreadCommand = (program: Command) => {
  const unreadCommand = program.command("unread").description("Unread status commands")

  unreadCommand
    .command("count")
    .description("Get total unread count")
    .action(async function (this: Command) {
      await runCommand(this, async ({ client }) => {
        const response = await client.api.reads.getTotalCount()
        return response.data
      })
    })

  unreadCommand
    .command("list")
    .description("List subscriptions with unread entries")
    .option("--view <type>", `View type: ${viewHelp}`, parseView)
    .action(async function (this: Command, options: UnreadListOptions) {
      await runCommand(this, async ({ client }) => {
        const [unreadResponse, subscriptionsResponse] = await Promise.all([
          client.api.reads.get(options.view !== undefined ? { view: options.view } : {}),
          client.api.subscriptions.get(options.view !== undefined ? { view: options.view } : {}),
        ])

        const unreadMap = unreadResponse.data
        const items = subscriptionsResponse.data
          .map((subscription) => {
            const unreadKey = isInboxSubscription(subscription)
              ? subscription.inboxId
              : subscription.feedId
            const unreadCount = unreadMap[unreadKey] ?? 0

            return {
              sourceType: isInboxSubscription(subscription)
                ? "inbox"
                : isListSubscription(subscription)
                  ? "list"
                  : "feed",
              sourceId: isInboxSubscription(subscription)
                ? subscription.inboxId
                : isListSubscription(subscription)
                  ? subscription.listId
                  : subscription.feedId,
              feedId: subscription.feedId,
              title: resolveTitle(subscription),
              category: subscription.category ?? null,
              view: subscription.view,
              unreadCount,
              isPrivate: subscription.isPrivate,
            }
          })
          .filter((item) => item.unreadCount > 0)
          .sort((left, right) => right.unreadCount - left.unreadCount)

        return {
          total: items.reduce((sum, item) => sum + item.unreadCount, 0),
          items,
        }
      })
    })
}
