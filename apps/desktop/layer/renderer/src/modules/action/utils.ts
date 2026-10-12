import type { ActionItem } from "@follow/store/action/store"

const pad = (value: number) => value.toString().padStart(2, "0")

// Both the date and the time are local, so the name matches the user's clock
export const generateExportFilename = (now = new Date()) => {
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const time = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
  return `folo-actions-${date}-${time}.json`
}

/** Why a "Matches Regex" pattern does not compile, or null when it does */
export const getRegexError = (pattern: unknown): string | null => {
  if (typeof pattern !== "string") return null
  try {
    new RegExp(pattern)
    return null
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

/**
 * The index of the first rule with a regex condition that does not compile, or -1. The server
 * stores such a rule as is, and it then never matches.
 */
export const findRuleIndexWithInvalidRegex = (rules: ActionItem[]) =>
  rules.findIndex((rule) =>
    rule.condition.some((group) =>
      group.some((item) => item.operator === "regex" && getRegexError(item.value) !== null),
    ),
  )
