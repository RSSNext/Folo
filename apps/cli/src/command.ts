import type { Command } from "commander"

import type { CommandContext } from "./client"
import { createCommandContext, getGlobalOptions } from "./client"
import { normalizeError, printFailure, printSuccess } from "./output"

interface RunCommandOptions {
  requireAuth?: boolean
}

export const runCommand = async (
  command: Command,
  handler: (context: CommandContext) => Promise<unknown>,
  options: RunCommandOptions = {},
) => {
  const fallbackOptions = getGlobalOptions(command)
  const requireAuth = options.requireAuth ?? true

  let context: CommandContext | null = null
  try {
    context = await createCommandContext(command, requireAuth)
    const result = await handler(context)
    printSuccess(context.options.format, result)
  } catch (error) {
    const format = context?.options.format ?? fallbackOptions.format
    const verbose = context?.options.verbose ?? fallbackOptions.verbose
    printFailure(format, normalizeError(error, verbose))
    process.exitCode = 1
  }
}
