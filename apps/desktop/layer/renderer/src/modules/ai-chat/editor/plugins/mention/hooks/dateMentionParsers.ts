import dayjs from "dayjs"

import type { MentionData } from "../types"
import {
  CHINESE_LAST_WEEK_PREFIXES,
  CHINESE_THIS_WEEK_PREFIXES,
  CHINESE_WEEKDAY_MAP,
  DATE_FORMATS,
  ENGLISH_LAST_WEEK_PREFIXES,
  ENGLISH_THIS_WEEK_PREFIXES,
  ENGLISH_WEEKDAY_MAP,
  RELATIVE_DATE_CONFIGS,
  WEEKDAY_AUTOCOMPLETE_CONFIGS,
} from "./dateMentionConfig"
import { clampRangeToPastMonth, createMentionFromRange, formatRangeValue } from "./dateMentionUtils"

type MentionParser = (query: string) => MentionData | null
type MentionListBuilder = (query: string) => MentionData[]

export const buildRelativeDateMentions: MentionListBuilder = (query) => {
  const normalized = query.trim().toLowerCase()
  const today = dayjs().startOf("day")
  const mentions: MentionData[] = []

  RELATIVE_DATE_CONFIGS.forEach((config) => {
    const range = config.range(today)
    if (!range) return

    const keywordPool = new Set(config.keywordSeeds.map((seed) => seed.toLowerCase()))
    keywordPool.add(formatRangeValue(range))

    const matches =
      !normalized || Array.from(keywordPool).some((keyword) => keyword.includes(normalized))

    if (!matches) return

    mentions.push(createMentionFromRange(range, config.displayName, config.id))
  })

  return mentions
}

const buildWeekdayMention = (
  dayIndex: number,
  prefix: "auto" | "this" | "last",
  displayName: string,
): MentionData | null => {
  const today = dayjs().startOf("day")
  const minAllowed = today.subtract(1, "month")

  let baseWeekStart = today.startOf("week")

  if (prefix === "last") {
    baseWeekStart = baseWeekStart.subtract(1, "week")
  }

  let candidate = baseWeekStart.add(dayIndex, "day")

  if ((prefix === "auto" || prefix === "this") && candidate.isAfter(today)) {
    candidate = candidate.subtract(1, "week")
  }

  if (candidate.isAfter(today)) {
    candidate = today
  }

  if (candidate.isBefore(minAllowed)) {
    return null
  }

  const clamped = clampRangeToPastMonth({ start: candidate, end: candidate })
  if (!clamped) return null

  return createMentionFromRange(clamped, displayName)
}

const parseWeekdayMention: MentionParser = (raw) => {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const normalized = trimmed.toLowerCase()
  const englishMatch = normalized.match(
    /^(?:(this week|this|current week|current|last week|last|previous week|previous)\s+)?(monday|mon|tuesday|tue|tues|wednesday|wed|weds|thursday|thu|thur|thurs|friday|fri|saturday|sat|sunday|sun)$/,
  )

  if (englishMatch) {
    const prefixRaw = (englishMatch[1] ?? "").trim()
    const dayToken = englishMatch[2]
    if (!dayToken) return null

    const dayIndex = ENGLISH_WEEKDAY_MAP[dayToken]
    if (dayIndex === undefined) return null

    let prefix: "auto" | "this" | "last" = "auto"
    if (prefixRaw) {
      if (ENGLISH_THIS_WEEK_PREFIXES.has(prefixRaw)) {
        prefix = "this"
      } else if (ENGLISH_LAST_WEEK_PREFIXES.has(prefixRaw)) {
        prefix = "last"
      } else {
        return null
      }
    }

    return buildWeekdayMention(dayIndex, prefix, trimmed)
  }

  const chineseMatch = trimmed.match(
    /^(这周|本周|这星期|本星期|这礼拜|本礼拜|上周|上星期|上一周|上个星期|上礼拜|上个礼拜)?(周[一二三四五六日天]|星期[一二三四五六日天]|礼拜[一二三四五六日天])$/,
  )

  if (chineseMatch) {
    const prefixRaw = chineseMatch[1]
    const dayToken = chineseMatch[2]
    if (!dayToken) return null

    const dayIndex = CHINESE_WEEKDAY_MAP[dayToken]
    if (dayIndex === undefined) return null

    let prefix: "auto" | "this" | "last" = "auto"
    if (prefixRaw) {
      if (CHINESE_THIS_WEEK_PREFIXES.has(prefixRaw)) {
        prefix = "this"
      } else if (CHINESE_LAST_WEEK_PREFIXES.has(prefixRaw)) {
        prefix = "last"
      } else {
        return null
      }
    }

    return buildWeekdayMention(dayIndex, prefix, trimmed)
  }

  return null
}

export const buildWeekdayAutoCompleteMentions: MentionListBuilder = (query) => {
  const trimmed = query.trim()
  if (!trimmed) return []

  const normalized = trimmed.toLowerCase()

  return WEEKDAY_AUTOCOMPLETE_CONFIGS.reduce<MentionData[]>((acc, config) => {
    const matches = config.keywords.some((keyword) => {
      const lower = keyword.toLowerCase()
      return lower.includes(normalized) || normalized.includes(lower)
    })

    if (!matches) return acc

    const mention = buildWeekdayMention(config.dayIndex, config.prefix, config.displayName)
    if (mention) {
      acc.push({ ...mention, id: config.id })
    }

    return acc
  }, [])
}

const parseDateRangeInput: MentionParser = (raw) => {
  if (!raw.includes("..")) return null

  const [startRaw, endRaw] = raw.split("..", 2)
  if (!startRaw || !endRaw) return null

  const startDate = parseDateInput(startRaw)
  const endDate = parseDateInput(endRaw)
  if (!startDate || !endDate) return null

  const range = clampRangeToPastMonth({ start: startDate, end: endDate })
  return range ? createMentionFromRange(range, null) : null
}

const parseDateInput = (raw: string) => {
  const trimmed = raw.trim()
  if (!trimmed) return null

  for (const format of DATE_FORMATS) {
    const parsed = dayjs(trimmed, format, true)
    if (parsed.isValid()) {
      return parsed.startOf("day")
    }
  }

  return parseMonthDayInput(trimmed)
}

const parseMonthDayInput = (raw: string) => {
  const currentDay = dayjs().startOf("day")
  const currentYear = currentDay.year()

  const numericMatch = raw.match(/^(\d{1,2})[-/.](\d{1,2})$/)
  const zhMatch = raw.match(/^(\d{1,2})月(\d{1,2})日$/)

  const match = numericMatch ?? zhMatch
  if (!match) return null

  const month = Number(match[1])
  const day = Number(match[2])
  if (Number.isNaN(month) || Number.isNaN(day)) {
    return null
  }

  let candidate = dayjs(`${currentYear}-${month}-${day}`, "YYYY-M-D", true)
  if (!candidate.isValid()) {
    return null
  }

  if (candidate.isAfter(currentDay)) {
    candidate = candidate.subtract(1, "year")
  }

  return candidate.startOf("day")
}

const parseSpecificDate: MentionParser = (raw) => {
  const date = parseDateInput(raw)
  if (!date) return null

  const range = clampRangeToPastMonth({ start: date, end: date })
  return range ? createMentionFromRange(range, date.format("MMMM D, YYYY")) : null
}

const parseNumericMonthMention: MentionParser = (raw) => {
  const normalized = raw.trim()
  if (!normalized) return null

  const hyphenMatch = normalized.match(/^(\d{4})[-/](\d{1,2})$/)
  if (hyphenMatch) {
    const [, year, month] = hyphenMatch
    const monthStart = dayjs(`${year}-${month}-01`, "YYYY-M-D", true)
    if (monthStart.isValid()) {
      const range = clampRangeToPastMonth({
        start: monthStart.startOf("month"),
        end: monthStart.endOf("month"),
      })
      return range ? createMentionFromRange(range, monthStart.format("MMMM YYYY")) : null
    }
  }

  if (/^\d{6}$/.test(normalized)) {
    const year = normalized.slice(0, 4)
    const month = normalized.slice(4)
    const monthStart = dayjs(`${year}-${month}-01`, "YYYY-M-D", true)
    if (monthStart.isValid()) {
      const range = clampRangeToPastMonth({
        start: monthStart.startOf("month"),
        end: monthStart.endOf("month"),
      })
      return range ? createMentionFromRange(range, monthStart.format("MMMM YYYY")) : null
    }
  }

  return null
}

const parseNamedMonthMention: MentionParser = (raw) => {
  const monthFormats = ["MMMM YYYY", "MMM YYYY", "YYYY MMMM", "YYYY MMM", "YYYY年M月", "YYYY年MM月"]

  for (const format of monthFormats) {
    const parsed = dayjs(raw, format, true)
    if (parsed.isValid()) {
      const range = clampRangeToPastMonth({
        start: parsed.startOf("month"),
        end: parsed.endOf("month"),
      })
      return range ? createMentionFromRange(range, parsed.format("MMMM YYYY")) : null
    }
  }

  return null
}

const parseYearMention: MentionParser = (raw) => {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const numericMatch = trimmed.match(/^(\d{4})$/)
  if (numericMatch) {
    const [, year] = numericMatch
    const yearStart = dayjs(`${year}-01-01`, "YYYY-MM-DD", true)
    if (yearStart.isValid()) {
      const range = clampRangeToPastMonth({
        start: yearStart.startOf("year"),
        end: yearStart.endOf("year"),
      })
      return range ? createMentionFromRange(range, yearStart.format("YYYY")) : null
    }
  }

  const localizedMatch = trimmed.match(/^(\d{4})年$/)
  if (localizedMatch) {
    const [, year] = localizedMatch
    const yearStart = dayjs(`${year}-01-01`, "YYYY-MM-DD", true)
    if (yearStart.isValid()) {
      const range = clampRangeToPastMonth({
        start: yearStart.startOf("year"),
        end: yearStart.endOf("year"),
      })
      return range ? createMentionFromRange(range, yearStart.format("YYYY")) : null
    }
  }

  return null
}

const singleMentionParsers: MentionParser[] = [
  parseDateRangeInput,
  parseSpecificDate,
  parseWeekdayMention,
  parseNumericMonthMention,
  parseNamedMonthMention,
  parseYearMention,
]

export const buildAbsoluteDateMentions: MentionListBuilder = (query) => {
  for (const parser of singleMentionParsers) {
    const mention = parser(query)
    if (mention) {
      return [mention]
    }
  }

  return []
}

export const buildDateMentions = (query: string): MentionData[] => {
  const mentions = new Map<string, MentionData>()

  const addMention = (mention: MentionData) => {
    const key = `${mention.type}:${String(mention.value)}`
    if (!mentions.has(key)) {
      mentions.set(key, mention)
    }
  }

  buildRelativeDateMentions(query).forEach(addMention)
  buildWeekdayAutoCompleteMentions(query).forEach(addMention)
  buildAbsoluteDateMentions(query).forEach(addMention)

  return Array.from(mentions.values())
}
