import type { Command } from "commander"

import type { CommandContext } from "./client"
import { createCommandContext, getGlobalOptions } from "./client"
import { normalizeError, printFailure, printSuccess } from "./output"

interface RunCommandOptions<T> {
  requireAuth?: boolean
  /** What the table format shows of the result, such as a few fields of each entry */
  table?: (result: T) => unknown
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

export const runCommand = async <T>(
  command: Command,
  handler: (context: CommandContext) => Promise<T>,
  options: RunCommandOptions<T> = {},
) => {
  const fallbackOptions = getGlobalOptions(command)
  const requireAuth = options.requireAuth ?? true

  let context: CommandContext | null = null
  try {
    context = await createCommandContext(command, requireAuth)
    const result = await handler(context)
    const { format } = context.options
    printSuccess(format, format === "table" && options.table ? options.table(result) : result)
  } catch (error) {
    const format = context?.options.format ?? fallbackOptions.format
    const verbose = context?.options.verbose ?? fallbackOptions.verbose
    printFailure(format, normalizeError(error, { verbose, apiUrl: context?.options.apiUrl }))
    process.exitCode = 1
  }
}
