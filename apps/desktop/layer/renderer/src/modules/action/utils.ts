import type { ActionItem } from "@follow/store/action/store"

export const generateExportFilename = () => {
  const now = new Date()
  const dateStr = now.toISOString().split("T")[0] // YYYY-MM-DD
  const timeStr = now.toTimeString().split(" ")[0]?.replaceAll(":", "-") // HH-MM-SS
  return `follow-actions-${dateStr}-${timeStr}.json`
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
