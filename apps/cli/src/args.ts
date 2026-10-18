import { InvalidArgumentError } from "commander"

import type { OutputFormat } from "./output"

// Parsers throw InvalidArgumentError, which Commander reports with the option it came from,
// such as "option '--limit <n>' argument 'abc' is invalid. Expected a positive integer."

const viewMap: Readonly<Record<string, number>> = {
  article: 0,
  articles: 0,
  social: 1,
  socialmedia: 1,
  picture: 2,
  pictures: 2,
  video: 3,
  videos: 3,
  audio: 4,
  notification: 5,
  notifications: 5,
}

export const viewHelp =
  "articles(0) | social(1) | pictures(2) | videos(3) | audio(4) | notifications(5)"

export const parseView = (value: string): number => {
  const normalized = value.trim().toLowerCase()
  if (/^\d+$/.test(normalized)) {
    const parsed = Number.parseInt(normalized, 10)
    if (parsed >= 0 && parsed <= 5) {
      return parsed
    }
  }

  const mapped = viewMap[normalized]
  if (mapped !== undefined) {
    return mapped
  }

  throw new InvalidArgumentError(`Invalid view. Use ${viewHelp}.`)
}

/** Digits only: Number.parseInt would read "1e3" as 1 and "7abc" as 7 */
const parseInteger = (value: string, min: number): number | null => {
  const normalized = value.trim()
  if (!/^\d+$/.test(normalized)) {
    return null
  }
  const parsed = Number(normalized)
  return Number.isSafeInteger(parsed) && parsed >= min ? parsed : null
}

export const parsePositiveInt = (value: string): number => {
  const parsed = parseInteger(value, 1)
  if (parsed === null) {
    throw new InvalidArgumentError("Expected a positive integer.")
  }
  return parsed
}

export const parseNonNegativeInt = (value: string): number => {
  const parsed = parseInteger(value, 0)
  if (parsed === null) {
    throw new InvalidArgumentError("Expected a non-negative integer.")
  }
  return parsed
}

export const parseISODate = (value: string): string => {
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) {
    throw new InvalidArgumentError(
      "Invalid datetime. Use an ISO 8601 date such as 2026-02-25T10:30:00Z.",
    )
  }
  return new Date(timestamp).toISOString()
}

const formatChoices = (choices: readonly string[]) =>
  choices.length > 1
    ? `${choices.slice(0, -1).join(", ")} or ${choices.at(-1)}`
    : (choices[0] ?? "")

/** A parser that accepts one of `choices`, for options such as --target */
export const parseChoice =
  <T extends string>(name: string, choices: readonly T[]) =>
  (value: string): T => {
    const choice = choices.find((item) => item === value)
    if (choice === undefined) {
      throw new InvalidArgumentError(`Invalid ${name}. Use ${formatChoices(choices)}.`)
    }
    return choice
  }

export const parseFormat = parseChoice<OutputFormat>("format", ["json", "table", "plain"])
