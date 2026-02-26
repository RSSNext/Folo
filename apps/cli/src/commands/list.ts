import type { Command } from "commander"

import { parseNonNegativeInt, parseView, viewHelp } from "../args"
import { runCommand } from "../command"
import { CLIError } from "../output"

interface ListCreateOptions {
  title: string
  description?: string
  view?: number
  fee?: number
  image?: string
}

interface ListUpdateOptions {
  title?: string
  description?: string
  view?: number
  fee?: number
  image?: string
}

interface ListFeedOptions {
  feed: string
}

export const registerListCommand = (program: Command) => {
  const listCommand = program.command("list").description("Manage lists")

  listCommand
    .command("ls")
    .description("List my lists")
    .action(async function (this: Command) {
      await runCommand(this, async ({ client }) => {
        const response = await client.api.lists.list({})
        return response.data
      })
    })

  listCommand
    .command("get")
    .description("Get list detail")
    .argument("<listId>", "List ID")
    .action(async function (this: Command, listId: string) {
      await runCommand(this, async ({ client }) => {
        const response = await client.api.lists.get({ listId })
        return response.data
      })
    })

  listCommand
    .command("create")
    .description("Create a list")
    .requiredOption("--title <title>", "List title")
    .option("--description <description>", "List description")
    .option("--view <type>", `View type: ${viewHelp}`, parseView)
    .option("--fee <amount>", "List fee", parseNonNegativeInt, 0)
    .option("--image <url>", "List image URL")
    .action(async function (this: Command, options: ListCreateOptions) {
      await runCommand(this, async ({ client }) => {
        const response = await client.api.lists.create({
          title: options.title,
          description: options.description ?? null,
          view: options.view ?? 0,
          fee: options.fee ?? 0,
          image: options.image ?? null,
        })

        return response.data
      })
    })

  listCommand
    .command("update")
    .description("Update a list")
    .argument("<listId>", "List ID")
    .option("--title <title>", "List title")
    .option("--description <description>", "List description")
    .option("--view <type>", `View type: ${viewHelp}`, parseView)
    .option("--fee <amount>", "List fee", parseNonNegativeInt)
    .option("--image <url>", "List image URL")
    .action(async function (this: Command, listId: string, options: ListUpdateOptions) {
      await runCommand(this, async ({ client }) => {
        if (
          options.title === undefined &&
          options.description === undefined &&
          options.view === undefined &&
          options.fee === undefined &&
          options.image === undefined
        ) {
          throw new CLIError(
            "INVALID_ARGUMENT",
            "No update fields provided. Use at least one of --title, --description, --view, --fee, --image.",
          )
        }

        const response = await client.api.lists.update({
          listId,
          title: options.title,
          description: options.description,
          view: options.view,
          fee: options.fee,
          image: options.image,
        })

        return response.data
      })
    })

  listCommand
    .command("delete")
    .description("Delete a list")
    .argument("<listId>", "List ID")
    .action(async function (this: Command, listId: string) {
      await runCommand(this, async ({ client }) => {
        const response = await client.api.lists.delete({ listId })
        return response.data
      })
    })

  listCommand
    .command("add-feed")
    .description("Add feed to a list")
    .argument("<listId>", "List ID")
    .requiredOption("--feed <feedId>", "Feed ID")
    .action(async function (this: Command, listId: string, options: ListFeedOptions) {
      await runCommand(this, async ({ client }) => {
        const response = await client.api.lists.addFeeds({
          listId,
          feedId: options.feed,
        })
        return response.data
      })
    })

  listCommand
    .command("remove-feed")
    .description("Remove feed from a list")
    .argument("<listId>", "List ID")
    .requiredOption("--feed <feedId>", "Feed ID")
    .action(async function (this: Command, listId: string, options: ListFeedOptions) {
      await runCommand(this, async ({ client }) => {
        const response = await client.api.lists.removeFeed({
          listId,
          feedId: options.feed,
        })
        return response.data
      })
    })
}
