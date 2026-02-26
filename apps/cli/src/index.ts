import { Command } from "commander"

import { parseFormat } from "./args"
import { defaultApiURL } from "./client"
import { registerAuthCommand } from "./commands/auth"
import { registerCollectionCommand } from "./commands/collection"
import { registerEntryCommand } from "./commands/entry"
import { registerFeedCommand } from "./commands/feed"
import { registerListCommand } from "./commands/list"
import { registerOPMLCommand } from "./commands/opml"
import { registerSearchCommand } from "./commands/search"
import { registerSubscriptionCommand } from "./commands/subscription"
import { registerTimelineCommand } from "./commands/timeline"
import { registerUnreadCommand } from "./commands/unread"
import type { OutputFormat } from "./output"
import { normalizeError, printFailure } from "./output"

const program = new Command()

program
  .name("folo")
  .description("Folo CLI client for structured automation")
  .version("0.1.0")
  .option("-f, --format <format>", "Output format: json | table | plain", parseFormat, "json")
  .option("--api-url <url>", `API base URL (default: ${defaultApiURL})`)
  .option("--token <token>", "Override stored token")
  .option("--verbose", "Enable verbose request/response logging", false)

registerAuthCommand(program)
registerTimelineCommand(program)
registerSubscriptionCommand(program)
registerEntryCommand(program)
registerFeedCommand(program)
registerListCommand(program)
registerSearchCommand(program)
registerCollectionCommand(program)
registerOPMLCommand(program)
registerUnreadCommand(program)

const resolveRequestedFormat = (argv: string[]): OutputFormat => {
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    if ((current === "--format" || current === "-f") && argv[index + 1]) {
      try {
        return parseFormat(argv[index + 1]!)
      } catch {
        return "json"
      }
    }
  }
  return "json"
}

try {
  await program.parseAsync(process.argv)
} catch (error) {
  const format = resolveRequestedFormat(process.argv)
  printFailure(format, normalizeError(error))
  process.exitCode = 1
}
