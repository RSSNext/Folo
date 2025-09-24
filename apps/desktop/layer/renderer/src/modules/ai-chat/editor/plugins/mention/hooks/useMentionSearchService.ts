import type { Dayjs } from "dayjs"
import dayjs from "dayjs"
import { useMemo } from "react"

import { useFeedEntrySearchService } from "~/modules/ai-chat/hooks/useFeedEntrySearchService"
import { MENTION_DATE_VALUE_FORMAT } from "~/modules/ai-chat/utils/mentionDate"

import type { MentionData, MentionType } from "../types"

const DATE_FORMATS = [
  "YYYY-MM-DD",
  "YYYY/MM/DD",
  "YYYY.MM.DD",
  "YYYYMMDD",
  "YYYY-M-D",
  "YYYY/M/D",
  "YYYY.M.D",
  "MM/DD/YYYY",
  "M/D/YYYY",
  "DD/MM/YYYY",
  "D/M/YYYY",
  "MM-DD-YYYY",
  "M-D-YYYY",
  "DD-MM-YYYY",
  "D-M-YYYY",
  "MMMM D, YYYY",
  "MMM D, YYYY",
  "D MMM YYYY",
  "D MMMM YYYY",
  "MMMM D YYYY",
  "MMM D YYYY",
  "YYYY年M月D日",
]

const MAX_INLINE_DATE_SUGGESTIONS = 3

const ENGLISH_WEEKDAY_MAP: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  weds: 3,
  thursday: 4,
  thu: 4,
  thur: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
}

const CHINESE_WEEKDAY_MAP: Record<string, number> = {
  周日: 0,
  周天: 0,
  星期日: 0,
  星期天: 0,
  礼拜日: 0,
  礼拜天: 0,
  周一: 1,
  星期一: 1,
  礼拜一: 1,
  周二: 2,
  星期二: 2,
  礼拜二: 2,
  周三: 3,
  星期三: 3,
  礼拜三: 3,
  周四: 4,
  星期四: 4,
  礼拜四: 4,
  周五: 5,
  星期五: 5,
  礼拜五: 5,
  周六: 6,
  星期六: 6,
  礼拜六: 6,
}

const ENGLISH_THIS_WEEK_PREFIXES = new Set(["this", "this week", "current", "current week"])

const ENGLISH_LAST_WEEK_PREFIXES = new Set(["last", "last week", "previous", "previous week"])

const CHINESE_THIS_WEEK_PREFIXES = new Set(["这周", "本周", "这星期", "本星期", "这礼拜", "本礼拜"])

const CHINESE_LAST_WEEK_PREFIXES = new Set([
  "上周",
  "上星期",
  "上一周",
  "上个星期",
  "上礼拜",
  "上个礼拜",
])

const WEEKDAYS_INFO = [
  {
    index: 0,
    english: "Sunday",
    short: "Sun",
    chineseRoots: ["周日", "周天", "星期日", "星期天", "礼拜日", "礼拜天"],
  },
  {
    index: 1,
    english: "Monday",
    short: "Mon",
    chineseRoots: ["周一", "星期一", "礼拜一"],
  },
  {
    index: 2,
    english: "Tuesday",
    short: "Tue",
    chineseRoots: ["周二", "星期二", "礼拜二"],
  },
  {
    index: 3,
    english: "Wednesday",
    short: "Wed",
    chineseRoots: ["周三", "星期三", "礼拜三"],
  },
  {
    index: 4,
    english: "Thursday",
    short: "Thu",
    chineseRoots: ["周四", "星期四", "礼拜四"],
  },
  {
    index: 5,
    english: "Friday",
    short: "Fri",
    chineseRoots: ["周五", "星期五", "礼拜五"],
  },
  {
    index: 6,
    english: "Saturday",
    short: "Sat",
    chineseRoots: ["周六", "星期六", "礼拜六"],
  },
] as const

type WeekdayAutoCompleteEntry = {
  id: string
  dayIndex: number
  prefix: "this" | "last"
  displayName: string
  keywords: string[]
}

const WEEKDAY_AUTOCOMPLETE_ENTRIES: WeekdayAutoCompleteEntry[] = WEEKDAYS_INFO.flatMap(
  ({ index, english, short, chineseRoots }) => {
    const englishLower = english.toLowerCase()
    const shortLower = short.toLowerCase()

    const baseEnglishKeywords = [englishLower, shortLower]
    const thisEnglishKeywords = [
      `this ${englishLower}`,
      `this ${shortLower}`,
      `current ${englishLower}`,
      `current ${shortLower}`,
      ...baseEnglishKeywords,
    ]
    const lastEnglishKeywords = [
      `last ${englishLower}`,
      `last ${shortLower}`,
      `previous ${englishLower}`,
      `previous ${shortLower}`,
      englishLower,
      shortLower,
    ]

    const chineseThisKeywords = chineseRoots.flatMap((root) => [root, `这${root}`, `本${root}`])
    const chineseLastKeywords = chineseRoots.flatMap((root) => [`上${root}`, `上个${root}`])

    return [
      {
        id: `date:this-${englishLower}`,
        dayIndex: index,
        prefix: "this" as const,
        displayName: `This ${english}`,
        keywords: [...thisEnglishKeywords, ...chineseThisKeywords],
      },
      {
        id: `date:last-${englishLower}`,
        dayIndex: index,
        prefix: "last" as const,
        displayName: `Last ${english}`,
        keywords: [...lastEnglishKeywords, ...chineseLastKeywords],
      },
    ]
  },
)

interface DateDescriptor {
  id?: string
  displayName: string | null
  start: Dayjs
  end: Dayjs
  keywords?: string[]
}

const formatRangeValue = (start: Dayjs, end: Dayjs): string => {
  const startIso = start.format(MENTION_DATE_VALUE_FORMAT)
  const endIso = end.format(MENTION_DATE_VALUE_FORMAT)
  return startIso === endIso ? startIso : `${startIso}..${endIso}`
}

const formatRangeText = (start: Dayjs, end: Dayjs): string => {
  if (start.isSame(end, "day")) {
    return start.format("MMM D, YYYY")
  }

  if (start.year() === end.year()) {
    return `${start.format("MMM D")} – ${end.format("MMM D, YYYY")}`
  }

  return `${start.format("MMM D, YYYY")} – ${end.format("MMM D, YYYY")}`
}

const formatRangeLabel = (displayName: string | null, start: Dayjs, end: Dayjs): string => {
  const rangeText = formatRangeText(start, end)

  if (!displayName) {
    return rangeText
  }

  if (displayName.toLowerCase() === rangeText.toLowerCase()) {
    return rangeText
  }

  return `${displayName} (${rangeText})`
}

const createDateMentionFromRange = (
  start: Dayjs,
  end: Dayjs,
  displayName: string | null,
  id?: string,
): MentionData | null => {
  const normalizedStart = start.startOf("day")
  const normalizedEnd = end.startOf("day")
  const currentDay = dayjs().startOf("day")
  const minAllowedDay = currentDay.subtract(1, "month")

  const isReversed = normalizedStart.isAfter(normalizedEnd)
  let rangeStart = isReversed ? normalizedEnd : normalizedStart
  let rangeEnd = isReversed ? normalizedStart : normalizedEnd

  if (rangeStart.isAfter(currentDay)) {
    return null
  }

  if (rangeEnd.isAfter(currentDay)) {
    rangeEnd = currentDay
  }

  if (rangeEnd.isBefore(minAllowedDay)) {
    return null
  }

  if (rangeStart.isBefore(minAllowedDay)) {
    rangeStart = minAllowedDay
  }

  if (rangeStart.isAfter(rangeEnd)) {
    return null
  }

  const rangeValue = formatRangeValue(rangeStart, rangeEnd)

  return {
    id: id ?? `date:${rangeValue}`,
    name: formatRangeLabel(displayName, rangeStart, rangeEnd),
    type: "date",
    value: rangeValue,
  }
}

const parseDateInput = (raw: string): Dayjs | null => {
  const trimmed = raw.trim()
  if (!trimmed) return null

  for (const format of DATE_FORMATS) {
    const parsed = dayjs(trimmed, format, true)
    if (parsed.isValid()) {
      return parsed.startOf("day")
    }
  }

  const monthDay = parseMonthDayInput(trimmed)
  if (monthDay) {
    return monthDay
  }

  return null
}

const parseMonthDayInput = (raw: string): Dayjs | null => {
  const normalized = raw.trim()
  if (!normalized) return null

  const currentDay = dayjs().startOf("day")
  const currentYear = currentDay.year()

  const numericMatch = normalized.match(/^(\d{1,2})[-/.](\d{1,2})$/)
  const zhMatch = normalized.match(/^(\d{1,2})月(\d{1,2})日$/)

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

const buildWeekdayMention = (
  dayIndex: number,
  prefix: "auto" | "this" | "last",
  displayName: string,
): MentionData | null => {
  const currentDay = dayjs().startOf("day")
  const minAllowedDay = currentDay.subtract(1, "month")

  let baseWeekStart = currentDay.startOf("week")

  if (prefix === "last") {
    baseWeekStart = baseWeekStart.subtract(1, "week")
  }

  let candidate = baseWeekStart.add(dayIndex, "day")

  if ((prefix === "auto" || prefix === "this") && candidate.isAfter(currentDay)) {
    candidate = candidate.subtract(1, "week")
  }

  if (candidate.isAfter(currentDay)) {
    candidate = currentDay
  }

  if (candidate.isBefore(minAllowedDay)) {
    return null
  }

  return createDateMentionFromRange(candidate, candidate, displayName)
}

const parseWeekdayMention = (raw: string): MentionData | null => {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const normalized = trimmed.toLowerCase()

  const englishMatch = normalized.match(
    /^(?:(this week|this|current week|current|last week|last|previous week|previous)\s+)?(monday|mon|tuesday|tue|tues|wednesday|wed|weds|thursday|thu|thur|thurs|friday|fri|saturday|sat|sunday|sun)$/,
  )

  if (englishMatch) {
    const prefixRaw = (englishMatch[1] ?? "").trim()
    const dayToken = englishMatch[2]

    if (!dayToken) {
      return null
    }

    const dayIndex = ENGLISH_WEEKDAY_MAP[dayToken]

    if (dayIndex === undefined) {
      return null
    }

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

    if (!dayToken) {
      return null
    }

    const dayIndex = CHINESE_WEEKDAY_MAP[dayToken]

    if (dayIndex === undefined) {
      return null
    }

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

const buildWeekdayAutoCompleteMentions = (query: string): MentionData[] => {
  const trimmed = query.trim()
  if (!trimmed) return []

  const normalized = trimmed.toLowerCase()
  const results: MentionData[] = []

  WEEKDAY_AUTOCOMPLETE_ENTRIES.forEach((entry) => {
    const matches = entry.keywords.some((keyword) => {
      const lowerKeyword = keyword.toLowerCase()
      return lowerKeyword.includes(normalized) || normalized.includes(lowerKeyword)
    })

    if (!matches) {
      return
    }

    const mention = buildWeekdayMention(entry.dayIndex, entry.prefix, entry.displayName)
    if (mention) {
      results.push(mention)
    }
  })

  return results
}

const parseDateRangeInput = (raw: string): MentionData | null => {
  if (!raw.includes("..")) return null

  const [startRaw, endRaw] = raw.split("..", 2)
  if (!startRaw || !endRaw) return null

  const startDate = parseDateInput(startRaw)
  const endDate = parseDateInput(endRaw)

  if (!startDate || !endDate) return null

  return createDateMentionFromRange(startDate, endDate, null)
}

const parseNumericMonthMention = (raw: string): MentionData | null => {
  const normalized = raw.trim()
  if (!normalized) return null

  const hyphenMatch = normalized.match(/^(\d{4})[-/](\d{1,2})$/)
  if (hyphenMatch) {
    const [, year, month] = hyphenMatch
    const monthStart = dayjs(`${year}-${month}-01`, "YYYY-M-D", true)
    if (monthStart.isValid()) {
      return createDateMentionFromRange(
        monthStart.startOf("month"),
        monthStart.endOf("month"),
        monthStart.format("MMMM YYYY"),
      )
    }
  }

  if (/^\d{6}$/.test(normalized)) {
    const year = normalized.slice(0, 4)
    const month = normalized.slice(4)
    const monthStart = dayjs(`${year}-${month}-01`, "YYYY-M-D", true)
    if (monthStart.isValid()) {
      return createDateMentionFromRange(
        monthStart.startOf("month"),
        monthStart.endOf("month"),
        monthStart.format("MMMM YYYY"),
      )
    }
  }

  return null
}

const parseNamedMonthMention = (raw: string): MentionData | null => {
  const monthFormats = ["MMMM YYYY", "MMM YYYY", "YYYY MMMM", "YYYY MMM", "YYYY年M月", "YYYY年MM月"]

  for (const format of monthFormats) {
    const parsed = dayjs(raw, format, true)
    if (parsed.isValid()) {
      const monthStart = parsed.startOf("month")
      return createDateMentionFromRange(
        monthStart,
        monthStart.endOf("month"),
        monthStart.format("MMMM YYYY"),
      )
    }
  }

  return null
}

const parseYearMention = (raw: string): MentionData | null => {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const numericMatch = trimmed.match(/^(\d{4})$/)
  if (numericMatch) {
    const [, year] = numericMatch
    const yearStart = dayjs(`${year}-01-01`, "YYYY-MM-DD", true)
    if (yearStart.isValid()) {
      return createDateMentionFromRange(
        yearStart.startOf("year"),
        yearStart.endOf("year"),
        yearStart.format("YYYY"),
      )
    }
  }

  const localizedMatch = trimmed.match(/^(\d{4})年$/)
  if (localizedMatch) {
    const [, year] = localizedMatch
    const yearStart = dayjs(`${year}-01-01`, "YYYY-MM-DD", true)
    if (yearStart.isValid()) {
      return createDateMentionFromRange(
        yearStart.startOf("year"),
        yearStart.endOf("year"),
        yearStart.format("YYYY"),
      )
    }
  }

  return null
}

const buildRelativeDateMentions = (query: string): MentionData[] => {
  const normalized = query.trim().toLowerCase()
  const today = dayjs().startOf("day")
  const yesterday = today.subtract(1, "day")
  const lastThreeStart = today.subtract(2, "day")
  const lastSevenStart = today.subtract(6, "day")
  const lastThirtyStart = today.subtract(29, "day")
  const thisWeekStart = today.startOf("week")
  const lastWeekStart = today.subtract(1, "week").startOf("week")
  const lastWeekEnd = lastWeekStart.add(6, "day")
  const thisMonthStart = today.startOf("month")
  const lastMonthStart = today.subtract(1, "month").startOf("month")
  const lastMonthEnd = lastMonthStart.endOf("month")

  const descriptors: DateDescriptor[] = [
    {
      id: "date:today",
      displayName: "Today",
      start: today,
      end: today,
      keywords: ["today", "tod", today.format(MENTION_DATE_VALUE_FORMAT), "今天", "今日"],
    },
    {
      id: "date:yesterday",
      displayName: "Yesterday",
      start: yesterday,
      end: yesterday,
      keywords: ["yesterday", "yday", yesterday.format(MENTION_DATE_VALUE_FORMAT), "昨天", "昨日"],
    },
    {
      id: "date:last-3-days",
      displayName: "Last 3 days",
      start: lastThreeStart,
      end: today,
      keywords: [
        "last 3 days",
        "past 3 days",
        "3d",
        formatRangeValue(lastThreeStart, today),
        "最近3天",
        "最近三天",
        "近3天",
        "近三天",
      ],
    },
    {
      id: "date:last-7-days",
      displayName: "Last 7 days",
      start: lastSevenStart,
      end: today,
      keywords: [
        "last 7 days",
        "past 7 days",
        "past week",
        "7d",
        formatRangeValue(lastSevenStart, today),
        "最近7天",
        "最近七天",
        "近7天",
        "近七天",
        "近一周",
        "最近一周",
      ],
    },
    {
      id: "date:last-30-days",
      displayName: "Last 30 days",
      start: lastThirtyStart,
      end: today,
      keywords: [
        "last 30 days",
        "past 30 days",
        "30d",
        "month",
        formatRangeValue(lastThirtyStart, today),
        "最近30天",
        "最近三十天",
        "近30天",
        "近三十天",
        "近一个月",
        "最近一个月",
      ],
    },
    {
      id: "date:this-week",
      displayName: "This week",
      start: thisWeekStart,
      end: today,
      keywords: [
        "this week",
        "current week",
        "week",
        formatRangeValue(thisWeekStart, today),
        "这周",
        "本周",
        "这星期",
        "本星期",
        "这礼拜",
        "本礼拜",
      ],
    },
    {
      id: "date:last-week",
      displayName: "Last week",
      start: lastWeekStart,
      end: lastWeekEnd,
      keywords: [
        "last week",
        "previous week",
        "lw",
        formatRangeValue(lastWeekStart, lastWeekEnd),
        "上周",
        "上一周",
        "上星期",
        "上个星期",
        "上礼拜",
        "上个礼拜",
      ],
    },
    {
      id: "date:this-month",
      displayName: "This month",
      start: thisMonthStart,
      end: today,
      keywords: [
        "this month",
        "current month",
        "month",
        thisMonthStart.format("YYYY-MM"),
        formatRangeValue(thisMonthStart, today),
        "这个月",
        "本月",
        "这月",
      ],
    },
    {
      id: "date:last-month",
      displayName: "Last month",
      start: lastMonthStart,
      end: lastMonthEnd,
      keywords: [
        "last month",
        "previous month",
        lastMonthStart.format("YYYY-MM"),
        formatRangeValue(lastMonthStart, lastMonthEnd),
        "上个月",
        "上月",
        "上一个月",
      ],
    },
  ]

  const mentions: MentionData[] = []

  descriptors
    .filter((descriptor) => {
      if (!normalized) return true

      const keywordPool = [
        descriptor.displayName?.toLowerCase() ?? "",
        ...(descriptor.keywords ?? []),
        formatRangeValue(descriptor.start, descriptor.end),
      ]

      return keywordPool.some((keyword) => keyword.includes(normalized))
    })
    .forEach((descriptor) => {
      const mention = createDateMentionFromRange(
        descriptor.start,
        descriptor.end,
        descriptor.displayName,
        descriptor.id,
      )

      if (mention) {
        mentions.push(mention)
      }
    })

  return mentions
}

const buildAbsoluteDateMentions = (query: string): MentionData[] => {
  const trimmed = query.trim()
  if (!trimmed) return []

  const rangeMention = parseDateRangeInput(trimmed)
  if (rangeMention) {
    return [rangeMention]
  }

  const singleDate = parseDateInput(trimmed)
  if (singleDate) {
    const mention = createDateMentionFromRange(
      singleDate,
      singleDate,
      singleDate.format("MMMM D, YYYY"),
    )

    return mention ? [mention] : []
  }

  const weekdayMention = parseWeekdayMention(query)
  if (weekdayMention) {
    return [weekdayMention]
  }

  const monthMention = parseNumericMonthMention(trimmed) ?? parseNamedMonthMention(trimmed)
  if (monthMention) {
    return [monthMention]
  }

  const yearMention = parseYearMention(trimmed)
  if (yearMention) {
    return [yearMention]
  }

  return []
}

const buildDateMentions = (query: string): MentionData[] => {
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

/**
 * Hook that provides search functionality for mentions
 * Uses the shared feed/entry search service
 */
export const useMentionSearchService = () => {
  const { search } = useFeedEntrySearchService({
    maxRecentEntries: 50,
  })

  const searchMentions = useMemo(() => {
    return async (query: string, type?: MentionType): Promise<MentionData[]> => {
      const trimmedQuery = query.trim()
      const results: MentionData[] = []
      const seen = new Set<string>()

      const pushResult = (mention: MentionData) => {
        const key = `${mention.type}:${String(mention.value)}`
        if (!seen.has(key)) {
          seen.add(key)
          results.push(mention)
        }
      }

      if (type === "date") {
        buildDateMentions(trimmedQuery).forEach(pushResult)
        return results
      }

      if (type === "feed" || type === "entry") {
        const searchResults = search(trimmedQuery, type, 10)
        searchResults.forEach((item) =>
          pushResult({
            id: item.id,
            name: item.title,
            type: item.type as MentionType,
            value: item.id,
          }),
        )
        return results
      }

      const dateSuggestions = buildDateMentions(trimmedQuery)
      const searchResults = search(trimmedQuery, undefined, 10)

      dateSuggestions.slice(0, MAX_INLINE_DATE_SUGGESTIONS).forEach(pushResult)

      searchResults.forEach((item) =>
        pushResult({
          id: item.id,
          name: item.title,
          type: item.type as MentionType,
          value: item.id,
        }),
      )

      if (dateSuggestions.length > MAX_INLINE_DATE_SUGGESTIONS) {
        dateSuggestions.slice(MAX_INLINE_DATE_SUGGESTIONS).forEach(pushResult)
      }

      return results
    }
  }, [search])

  return { searchMentions }
}
