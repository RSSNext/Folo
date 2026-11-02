import { Command, CommanderError } from "commander"

import packageJSON from "../package.json"
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
import type { OutputError, OutputFormat } from "./output"
import { normalizeError, printFailure } from "./output"

interface Program {
  program: Command
  /** The command whose help was shown last, such as a group run without a subcommand */
  getHelpCommand: () => Command | undefined
}

export const createProgram = (): Program => {
  const program = new Command()
  let helpCommand: Command | undefined

  // Usage errors are printed as the output format asks, like every other error, so they are
  // thrown instead of being written as plain text before exiting. Subcommands copy these
  // settings when they are created, so they come before the commands.
  program
    .exitOverride()
    .configureOutput({
      // Only errors and the help shown for one go to stderr; help asked for goes to stdout
      writeErr: () => {},
    })
    .on("beforeAllHelp", ({ command }: { command: Command }) => {
      helpCommand = command
    })

  program
    .name("folo")
    .description("Folo CLI client for structured automation")
    .version(packageJSON.version)
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

  return { program, getHelpCommand: () => helpCommand }
}

/** The format the command line asks for, read again when parsing it failed */
export const resolveRequestedFormat = (argv: string[]): OutputFormat => {
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]!
    if (current === "--") {
      break
    }

    let value: string | undefined
    if (current === "--format" || current === "-f") {
      value = argv[index + 1]
    } else if (current.startsWith("--format=")) {
      value = current.slice("--format=".length)
    } else if (current.startsWith("-f") && !current.startsWith("--")) {
      value = current.slice(2)
    }

    if (value !== undefined) {
      try {
        return parseFormat(value)
      } catch {
        return "json"
      }
    }
  }
  return "json"
}

const getCommandPath = (command: Command) => {
  const names: string[] = []
  for (let current: Command | null = command; current; current = current.parent) {
    names.unshift(current.name())
  }
  return names.join(" ")
}

const toUsageError = (error: CommanderError, helpCommand: Command | undefined): OutputError => {
  // A group run without a subcommand shows its help instead of an error message
  if (error.code === "commander.help") {
    const path = helpCommand ? getCommandPath(helpCommand) : "folo"
    return {
      code: "INVALID_ARGUMENT",
      message: `Missing command. Run \`${path} --help\` to see the commands it accepts.`,
    }
  }

  return {
    code: "INVALID_ARGUMENT",
    // Commander writes "error: unknown option '--x'" with a suggestion on the next line
    message: error.message
      .replace(/^error: /, "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join(" "),
  }
}

export const runCLI = async (argv: string[]) => {
  const { program, getHelpCommand } = createProgram()

  try {
    await program.parseAsync(argv)
  } catch (error) {
    // Help and the version were asked for and printed
    if (error instanceof CommanderError && error.exitCode === 0) {
      return
    }

    const format = resolveRequestedFormat(argv)
    printFailure(
      format,
      error instanceof CommanderError
        ? toUsageError(error, getHelpCommand())
        : normalizeError(error),
    )
    process.exitCode = 1
  }
}
