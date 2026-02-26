import type { MarkAllAsReadRequest } from "@follow-app/client-sdk"
import type { Command } from "commander"

import { parseView, viewHelp } from "../args"
import { runCommand } from "../command"
import { CLIError } from "../output"

interface MarkAllReadOptions {
  feed?: string
  list?: string
  view?: number
}

export const registerEntryCommand = (program: Command) => {
  const entryCommand = program.command("entry").description("Read and update entries")

  entryCommand
    .command("get")
    .description("Get entry detail")
    .argument("<entryId>", "Entry ID")
    .action(async function (this: Command, entryId: string) {
      await runCommand(this, async ({ client }) => {
        const response = await client.api.entries.get({ id: entryId })
        return response.data
      })
    })

  entryCommand
    .command("read")
    .description("Get readability content")
    .argument("<entryId>", "Entry ID")
    .action(async function (this: Command, entryId: string) {
      await runCommand(this, async ({ client }) => {
        const response = await client.api.entries.readability({ id: entryId })
        return response.data
      })
    })

  entryCommand
    .command("mark-read")
    .description("Mark entry as read")
    .argument("<entryId>", "Entry ID")
    .action(async function (this: Command, entryId: string) {
      await runCommand(this, async ({ client }) => {
        const response = await client.api.reads.markAsRead({ entryIds: [entryId] })
        return response.data
      })
    })

  entryCommand
    .command("mark-unread")
    .description("Mark entry as unread")
    .argument("<entryId>", "Entry ID")
    .action(async function (this: Command, entryId: string) {
      await runCommand(this, async ({ client }) => {
        const response = await client.api.reads.markAsUnread({ entryId })
        return response.data
      })
    })

  entryCommand
    .command("mark-all-read")
    .description("Mark entries as read in current scope")
    .option("--feed <feedId>", "Mark all entries in a feed as read")
    .option("--list <listId>", "Mark all entries in a list as read")
    .option("--view <type>", `View type: ${viewHelp}`, parseView)
    .action(async function (this: Command, options: MarkAllReadOptions) {
      await runCommand(this, async ({ client }) => {
        if (options.feed && options.list) {
          throw new CLIError("INVALID_ARGUMENT", "Use only one of --feed or --list.")
        }

        const request: MarkAllAsReadRequest = {
          feedId: options.feed,
          listId: options.list,
          view: options.view,
        }

        const response = await client.api.reads.markAllAsRead(request)
        return response.data
      })
    })
}
