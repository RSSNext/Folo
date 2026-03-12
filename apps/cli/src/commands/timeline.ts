import type { EntryListRequest } from "@follow-app/client-sdk"
import type { Command } from "commander"

import { parseISODate, parsePositiveInt, parseView, viewHelp } from "../args"
import { runCommand } from "../command"
import { CLIError } from "../output"

type TimelineQuery = EntryListRequest & {
  listId?: string
}

interface TimelineOptions {
  view?: number
  limit: number
  unreadOnly?: boolean
  cursor?: string
  feed?: string
  list?: string
  category?: string
}

export const registerTimelineCommand = (program: Command) => {
  program
    .command("timeline")
    .description("List timeline entries")
    .option("--view <type>", `View type: ${viewHelp}`, parseView)
    .option("--limit <n>", "Number of entries to fetch", parsePositiveInt, 20)
    .option("--unread-only", "Only unread entries", false)
    .option("--cursor <datetime>", "Pagination cursor (publishedAfter)", parseISODate)
    .option("--feed <feedId>", "Filter timeline by feed")
    .option("--list <listId>", "Filter timeline by list")
    .option("--category <name>", "Filter timeline by subscription category")
    .action(async function (this: Command, options: TimelineOptions) {
      await runCommand(this, async ({ client }) => {
        const scopedFilters = [options.feed, options.list, options.category].filter(Boolean)
        if (scopedFilters.length > 1) {
          throw new CLIError(
            "INVALID_ARGUMENT",
            "Use only one of --feed, --list, or --category at the same time.",
          )
        }

        const query: TimelineQuery = {
          limit: options.limit,
          read: options.unreadOnly ? false : undefined,
          view: options.view,
          publishedAfter: options.cursor,
        }

        if (options.feed) {
          query.feedId = options.feed
        }

        if (options.list) {
          query.listId = options.list
        }

        if (options.category) {
          const subscriptions = await client.api.subscriptions.get(
            options.view !== undefined ? { view: options.view } : {},
          )

          const feedIdList = subscriptions.data
            .filter((item) => item.category === options.category)
            .map((item) => item.feedId)
            .filter((item): item is string => item.length > 0)

          if (feedIdList.length === 0) {
            return {
              entries: [],
              nextCursor: null,
              hasNext: false,
            }
          }

          query.feedIdList = feedIdList
        }

        const response = await client.api.entries.list(query)
        const entries = response.data
        const nextCursor = entries.at(-1)?.entries.publishedAt ?? null

        return {
          entries,
          nextCursor,
          hasNext: Boolean(nextCursor) && entries.length >= options.limit,
        }
      })
    })
}
