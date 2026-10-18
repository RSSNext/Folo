import type {
  SubscriptionCreateRequest,
  SubscriptionDeleteRequest,
  SubscriptionUpdateRequest,
} from "@follow-app/client-sdk"
import type { Command } from "commander"

import { parseChoice, parseView, viewHelp } from "../args"
import { runCommand, toChangeResult } from "../command"
import { CLIError } from "../output"
import type { SubscriptionTarget } from "../subscriptions"
import { findSubscription, isListSubscription } from "../subscriptions"
import { toSubscriptionRow } from "../table-views"

type UpdateTarget = Exclude<SubscriptionTarget, "url">

const parseSubscriptionTarget = parseChoice<SubscriptionTarget>("target", ["feed", "list", "url"])
const parseUpdateTarget = parseChoice<UpdateTarget>("target", ["feed", "list"])

interface SubscriptionListOptions {
  view?: number
  category?: string
}

interface SubscriptionAddOptions {
  feed?: string
  list?: string
  category?: string
  view?: number
  private?: boolean
  title?: string
}

interface SubscriptionRemoveOptions {
  target: SubscriptionTarget
}

interface SubscriptionUpdateOptions {
  category?: string
  title?: string
  view?: number
  private?: boolean
  public?: boolean
  target: UpdateTarget
}

export const registerSubscriptionCommand = (program: Command) => {
  const subscriptionCommand = program.command("subscription").description("Manage subscriptions")

  subscriptionCommand
    .command("list")
    .description("List subscriptions")
    .option("--view <type>", `View type: ${viewHelp}`, parseView)
    .option("--category <name>", "Filter by category")
    .action(async function (this: Command, options: SubscriptionListOptions) {
      await runCommand(
        this,
        async ({ client }) => {
          const response = await client.api.subscriptions.get(
            options.view !== undefined ? { view: options.view } : {},
          )

          const subscriptions = options.category
            ? response.data.filter((item) => item.category === options.category)
            : response.data

          return {
            subscriptions,
          }
        },
        { table: (result) => ({ subscriptions: result.subscriptions.map(toSubscriptionRow) }) },
      )
    })

  subscriptionCommand
    .command("add")
    .description("Add a feed or list subscription")
    .option("--feed <url>", "Feed URL to subscribe")
    .option("--list <listId>", "List ID to subscribe")
    .option("--category <name>", "Subscription category")
    .option("--view <type>", `View type: ${viewHelp}`, parseView)
    .option("--private", "Mark subscription as private", false)
    .option("--title <title>", "Custom subscription title")
    .action(async function (this: Command, options: SubscriptionAddOptions) {
      await runCommand(this, async ({ client }) => {
        const selected = [options.feed, options.list].filter(Boolean)
        if (selected.length !== 1) {
          throw new CLIError("INVALID_ARGUMENT", "Use either --feed or --list when adding.")
        }

        const request: SubscriptionCreateRequest = {
          view: options.view ?? 0,
          category: options.category ?? null,
          isPrivate: options.private || false,
          title: options.title ?? null,
        }

        if (options.feed) {
          request.url = options.feed
          request.type = "feed"
        }

        if (options.list) {
          request.listId = options.list
          request.type = "list"
        }

        // The feed or list it followed, its unread counts and the sync id of the change
        const response = await client.api.subscriptions.create(request)
        // A URL without a feed, such as a page that links none or answers 404, is answered with
        // success and nothing followed
        if (!response.feed && !response.list) {
          throw new CLIError(
            "NOT_FOUND",
            options.feed ? `No feed found at ${options.feed}.` : `List ${options.list} not found.`,
          )
        }
        return toChangeResult(response)
      })
    })

  subscriptionCommand
    .command("remove")
    .description("Remove a subscription target")
    .argument("<id>", "Feed ID, list ID, or feed URL")
    .option(
      "--target <target>",
      "Subscription target type: feed | list | url",
      parseSubscriptionTarget,
      "feed",
    )
    .action(async function (this: Command, id: string, options: SubscriptionRemoveOptions) {
      await runCommand(this, async ({ client }) => {
        const subscription = await findSubscription(client, id, options.target)
        const request: SubscriptionDeleteRequest = isListSubscription(subscription)
          ? { listId: subscription.listId }
          : options.target === "url"
            ? { url: subscription.feeds.url }
            : { feedId: subscription.feedId }

        const response = await client.api.subscriptions.delete(request)
        return toChangeResult(response)
      })
    })

  subscriptionCommand
    .command("update")
    .description("Update a subscription target")
    .argument("<id>", "Feed ID or list ID")
    .option("--category <name>", "Set category")
    .option("--title <title>", "Set custom title")
    .option("--view <type>", `View type: ${viewHelp}`, parseView)
    .option("--private", "Set subscription private", false)
    .option("--public", "Set subscription public", false)
    .option("--target <target>", "Target type: feed | list", parseUpdateTarget, "feed")
    .action(async function (this: Command, id: string, options: SubscriptionUpdateOptions) {
      await runCommand(this, async ({ client }) => {
        if (options.private && options.public) {
          throw new CLIError(
            "INVALID_ARGUMENT",
            "Use only one of --private or --public when updating.",
          )
        }

        const request: SubscriptionUpdateRequest = {
          category: options.category ?? undefined,
          title: options.title ?? undefined,
          view: options.view,
        }

        if (options.private) {
          request.isPrivate = true
        } else if (options.public) {
          request.isPrivate = false
        }

        if (
          request.category === undefined &&
          request.title === undefined &&
          request.view === undefined &&
          request.isPrivate === undefined
        ) {
          throw new CLIError(
            "INVALID_ARGUMENT",
            "No update fields provided. Use at least one of --category, --title, --view, --private, --public.",
          )
        }

        const subscription = await findSubscription(client, id, options.target)
        if (isListSubscription(subscription)) {
          request.listId = subscription.listId
        } else {
          request.feedId = subscription.feedId
        }

        const response = await client.api.subscriptions.update(request)
        return toChangeResult(response)
      })
    })
}
