import type { OutputFormat } from "./output"

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

  throw new Error(`Invalid view "${value}". Use ${viewHelp}.`)
}

export const parsePositiveInt = (value: string): number => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive integer, got "${value}".`)
  }
  return parsed
}

export const parseNonNegativeInt = (value: string): number => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Expected a non-negative integer, got "${value}".`)
  }
  return parsed
}

export const parseISODate = (value: string): string => {
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) {
    throw new TypeError(`Invalid datetime value "${value}".`)
  }
  return new Date(timestamp).toISOString()
}

export const parseFormat = (value: string): OutputFormat => {
  if (value === "json" || value === "table" || value === "plain") {
    return value
  }
  throw new Error(`Invalid format "${value}". Use json, table, or plain.`)
}
