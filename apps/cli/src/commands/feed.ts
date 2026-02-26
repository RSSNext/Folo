import type { Command } from "commander"

import { runCommand } from "../command"

const isURL = (value: string) => value.startsWith("http://") || value.startsWith("https://")

export const registerFeedCommand = (program: Command) => {
  const feedCommand = program.command("feed").description("Manage feed data")

  feedCommand
    .command("get")
    .description("Get feed detail by feed ID or URL")
    .argument("<feedIdOrUrl>", "Feed ID or URL")
    .action(async function (this: Command, feedIdOrUrl: string) {
      await runCommand(this, async ({ client }) => {
        const response = await client.api.feeds.get(
          isURL(feedIdOrUrl) ? { url: feedIdOrUrl } : { id: feedIdOrUrl },
        )
        return response.data
      })
    })

  feedCommand
    .command("refresh")
    .description("Refresh feed")
    .argument("<feedId>", "Feed ID")
    .action(async function (this: Command, feedId: string) {
      await runCommand(this, async ({ client }) => {
        const response = await client.api.feeds.refresh({ id: feedId })
        return response.data
      })
    })

  feedCommand
    .command("analytics")
    .description("Get feed analytics")
    .argument("<feedId>", "Feed ID")
    .action(async function (this: Command, feedId: string) {
      await runCommand(this, async ({ client }) => {
        const response = await client.api.feeds.analytics({ id: [feedId] })
        return response.data
      })
    })
}
