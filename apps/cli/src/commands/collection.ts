import type { Command } from "commander"

import { parseISODate, parsePositiveInt, parseView, viewHelp } from "../args"
import { runCommand, toChangeResult } from "../command"
import { CLIError } from "../output"
import { fetchEntryPage, MAX_PAGE_SIZE } from "../pagination"
import { toCollectionRow } from "../table-views"

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
    .option(
      "--limit <n>",
      `Number of entries to fetch, at most ${MAX_PAGE_SIZE}`,
      parsePositiveInt,
      20,
    )
    .option("--cursor <datetime>", "Pagination cursor", parseISODate)
    .action(async function (this: Command, options: CollectionListOptions) {
      await runCommand(
        this,
        async ({ client }) =>
          fetchEntryPage({
            limit: options.limit,
            cursor: options.cursor,
            fetchEntries: async (request) =>
              (await client.api.entries.list({ ...request, isCollection: true })).data,
            // Collections are paged by when they were collected, not when they were published.
            // The SDK types the time as a Date while the JSON holds its ISO string.
            getCursor: (entry) =>
              entry.collections ? String(entry.collections.createdAt) : entry.entries.publishedAt,
            getId: (entry) => entry.entries.id,
          }),
        { table: (result) => ({ ...result, entries: result.entries.map(toCollectionRow) }) },
      )
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
        return toChangeResult(response)
      })
    })

  collectionCommand
    .command("remove")
    .description("Remove entry from collection")
    .argument("<entryId>", "Entry ID")
    .action(async function (this: Command, entryId: string) {
      await runCommand(this, async ({ client }) => {
        // The API answers the removal of an entry that is not collected with success, and
        // records it as a change for the user's other devices to sync, so it is checked first
        const { data: collected } = await client.api.collections.get({ entryId })
        if (!collected) {
          throw new CLIError("NOT_FOUND", `Entry ${entryId} is not in your collection.`)
        }

        const response = await client.api.collections.delete({
          entryId,
        })
        return toChangeResult(response)
      })
    })
}
