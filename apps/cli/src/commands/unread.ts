import type { Command } from "commander"

import { parseView, viewHelp } from "../args"
import { runCommand } from "../command"
import type { AnySubscription } from "../subscriptions"
import { getSubscriptionTitle, isInboxSubscription, isListSubscription } from "../subscriptions"

interface UnreadListOptions {
  view?: number
}

/**
 * Where the unread counts of a subscription are: GET /reads counts unread entries by feed and
 * by inbox, so a list's are those of its feeds, as the app counts them.
 */
const getUnreadKeys = (subscription: AnySubscription): string[] => {
  if (isInboxSubscription(subscription)) {
    return [subscription.inboxId]
  }
  if (isListSubscription(subscription)) {
    return subscription.lists.feedIds
  }
  return [subscription.feedId]
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
        const countUnread = (keys: Iterable<string>) => {
          let count = 0
          for (const key of keys) {
            count += unreadMap[key] ?? 0
          }
          return count
        }

        const subscriptions = subscriptionsResponse.data
        const items = subscriptions
          .map((subscription) => {
            const unreadCount = countUnread(getUnreadKeys(subscription))

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
              title: getSubscriptionTitle(subscription),
              category: subscription.category ?? null,
              view: subscription.view,
              unreadCount,
              isPrivate: subscription.isPrivate,
            }
          })
          .filter((item) => item.unreadCount > 0)
          .sort((left, right) => right.unreadCount - left.unreadCount)

        return {
          // A feed followed both directly and through a list counts in both rows, but its
          // entries count once in the total. It agrees with `unread count` but for the entries
          // of inboxes, which GET /reads/total-count leaves out.
          total: countUnread(new Set(subscriptions.flatMap(getUnreadKeys))),
          items,
        }
      })
    })
}
