import log from "electron-log"

/**
 * Logger for updater module with scoped prefix
 * All logs are prefixed with [Updater] for easy identification
 */
export const updaterLogger = log.scope("updater")

/**
 * Logger specifically for GitHub provider operations
 */
export const githubProviderLogger = log.scope("updater:github")

/**
 * Helper to log object properties in a formatted way
 */
export function logObject(logger: typeof updaterLogger, prefix: string, obj: Record<string, any>) {
  logger.info(`${prefix}:`)
  for (const [key, value] of Object.entries(obj)) {
    logger.info(`  ${key}: ${value}`)
  }
}
