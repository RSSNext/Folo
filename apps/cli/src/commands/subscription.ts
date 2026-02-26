import type {
  SubscriptionCreateRequest,
  SubscriptionDeleteRequest,
  SubscriptionUpdateRequest,
} from "@follow-app/client-sdk"
import type { Command } from "commander"

import { parseView, viewHelp } from "../args"
import { runCommand } from "../command"
import { CLIError } from "../output"

type SubscriptionTarget = "feed" | "list" | "url"
type UpdateTarget = "feed" | "list"

const parseSubscriptionTarget = (value: string): SubscriptionTarget => {
  if (value === "feed" || value === "list" || value === "url") {
    return value
  }
  throw new Error(`Invalid target "${value}". Use feed, list, or url.`)
}

const parseUpdateTarget = (value: string): UpdateTarget => {
  if (value === "feed" || value === "list") {
    return value
  }
  throw new Error(`Invalid target "${value}". Use feed or list.`)
}

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
      await runCommand(this, async ({ client }) => {
        const response = await client.api.subscriptions.get(
          options.view !== undefined ? { view: options.view } : {},
        )

        const subscriptions = options.category
          ? response.data.filter((item) => item.category === options.category)
          : response.data

        return {
          subscriptions,
        }
      })
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

        const response = await client.api.subscriptions.create(request)
        return {
          feed: response.feed,
          list: response.list,
          unread: response.unread,
        }
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
        const request: SubscriptionDeleteRequest = {}

        if (options.target === "feed") {
          request.feedId = id
        } else if (options.target === "list") {
          request.listId = id
        } else {
          request.url = id
        }

        const response = await client.api.subscriptions.delete(request)
        return response.data
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

        if (options.target === "feed") {
          request.feedId = id
        } else {
          request.listId = id
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

        const response = await client.api.subscriptions.update(request)
        return response.data
      })
    })
}
