import type { EntryListRequest } from "@follow-app/client-sdk"
import type { Command } from "commander"

import { parseISODate, parsePositiveInt, parseView, viewHelp } from "../args"
import { runCommand } from "../command"

interface CollectionListOptions {
  limit: number
  cursor?: string
}

interface CollectionAddOptions {
  view?: number
}

export const registerCollectionCommand = (program: Command) => {
  const collectionCommand = program.command("collection").description("Manage collections")

  collectionCommand
    .command("list")
    .description("List collected entries")
    .option("--limit <n>", "Number of entries to fetch", parsePositiveInt, 20)
    .option("--cursor <datetime>", "Pagination cursor", parseISODate)
    .action(async function (this: Command, options: CollectionListOptions) {
      await runCommand(this, async ({ client }) => {
        const request: EntryListRequest = {
          isCollection: true,
          limit: options.limit,
          publishedAfter: options.cursor,
        }

        const response = await client.api.entries.list(request)
        const entries = response.data
        const nextCursor = entries.at(-1)?.entries.publishedAt ?? null

        return {
          entries,
          nextCursor,
          hasNext: Boolean(nextCursor) && entries.length >= options.limit,
        }
      })
    })

  collectionCommand
    .command("add")
    .description("Add entry to collection")
    .argument("<entryId>", "Entry ID")
    .option("--view <type>", `View type: ${viewHelp}`, parseView)
    .action(async function (this: Command, entryId: string, options: CollectionAddOptions) {
      await runCommand(this, async ({ client }) => {
        const response = await client.api.collections.post({
          entryId,
          view: options.view,
        })
        return response.data
      })
    })

  collectionCommand
    .command("remove")
    .description("Remove entry from collection")
    .argument("<entryId>", "Entry ID")
    .action(async function (this: Command, entryId: string) {
      await runCommand(this, async ({ client }) => {
        const response = await client.api.collections.delete({
          entryId,
        })
        return response.data
      })
    })
}
