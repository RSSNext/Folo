import type { ActionItem } from "@follow/store/action/store"
import type { ActionFilterItem } from "@follow-app/client-sdk"

const pad = (value: number) => value.toString().padStart(2, "0")

// Both the date and the time are local, so the name matches the user's clock
export const generateExportFilename = (now = new Date()) => {
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const time = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
  return `folo-actions-${date}-${time}.json`
}

// A bare flag group at the start, such as the (?i) of (?i)news, which sets flags for all of it
const LEADING_FLAG_GROUP = /^\(\?([ims]+)\)/

/** Whether a pattern closes only the groups it opens, so a group around it ends at its end. */
const closesOnlyItsOwnGroups = (pattern: string) => {
  let depth = 0
  let inClass = false
  for (let index = 0; index < pattern.length; index++) {
    const char = pattern[index]

    if (char === "\\") {
      // A trailing backslash would escape the closing parenthesis of a group around it
      if (index + 1 >= pattern.length) return false
      index++
      continue
    }
    if (inClass) {
      if (char === "]") inClass = false
      continue
    }
    if (char === "[") {
      inClass = true
    } else if (char === "(") {
      depth++
    } else if (char === ")" && --depth < 0) {
      return false
    }
  }
  return true
}

/**
 * The flags and the rest of a pattern that starts with a bare flag group of the flags i, m and
 * s, such as (?i)news, or null. RegExp has no bare flag group, but the server saves such a new
 * pattern as a modifier group around the rest, (?i:news), which runs the rest with those flags.
 */
export const splitLeadingFlagGroup = (pattern: string): { flags: string; rest: string } | null => {
  const match = LEADING_FLAG_GROUP.exec(pattern)
  if (!match) return null
  const flags = match[1]!
  const rest = pattern.slice(match[0].length)
  // A repeated flag is refused, and a rest that closes a group it did not open is not the rest
  // of the pattern
  if (new Set(flags).size < flags.length || !closesOnlyItsOwnGroups(rest)) return null
  return { flags, rest }
}

/** Why a "Matches Regex" pattern does not compile, or null when it does */
export const getRegexError = (pattern: unknown): string | null => {
  if (typeof pattern !== "string") return null
  const leading = splitLeadingFlagGroup(pattern)
  try {
    if (leading) {
      new RegExp(leading.rest, leading.flags)
    } else {
      new RegExp(pattern)
    }
    return null
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

// What a condition is recognized by when a save sends it back, as the server keys it
const getConditionKey = ({ field, operator, value }: ActionFilterItem) =>
  JSON.stringify([field, operator, value])

/**
 * The index of the first rule with a new or changed regex condition that does not compile, or
 * -1. The server stores such a rule as is, and it then never matches. Conditions as they were
 * loaded are not checked, as the server does not check them again either: a pattern an older
 * client saved must not keep the user from saving other edits.
 */
export const findRuleIndexWithInvalidRegex = (
  rules: readonly ActionItem[],
  loadedRules: readonly ActionItem[] = [],
) => {
  const loadedConditions = new Set(
    loadedRules.flatMap((rule) => rule.condition.flat().map(getConditionKey)),
  )
  return rules.findIndex((rule) =>
    rule.condition.some((group) =>
      group.some(
        (item) =>
          item.operator === "regex" &&
          !loadedConditions.has(getConditionKey(item)) &&
          getRegexError(item.value) !== null,
      ),
    ),
  )
}
