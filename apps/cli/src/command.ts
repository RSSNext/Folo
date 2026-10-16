import type { Command } from "commander"

import type { CommandContext } from "./client"
import { createCommandContext, getGlobalOptions } from "./client"
import { normalizeError, printFailure, printSuccess } from "./output"

interface RunCommandOptions {
  requireAuth?: boolean
}

/**
 * The output of a change the API answers without a `data` field, although the published SDK
 * types promise one for most of them: the fields it sends besides its success code, such as the
 * sync id the change recorded. List edits and feed refreshes send none.
 */
export const toChangeResult = ({
  code: _code,
  ...fields
}: {
  code: number
}): Record<string, unknown> => fields

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
