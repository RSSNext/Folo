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

  const isReversed = normalizedStart.isAfter(normalizedEnd)
  const rangeStart = isReversed ? normalizedEnd : normalizedStart
  let rangeEnd = isReversed ? normalizedStart : normalizedEnd

  if (rangeStart.isAfter(currentDay)) {
    return null
  }

  if (rangeEnd.isAfter(currentDay)) {
    rangeEnd = currentDay
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

  return null
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
      keywords: ["today", "tod", today.format(MENTION_DATE_VALUE_FORMAT)],
    },
    {
      id: "date:yesterday",
      displayName: "Yesterday",
      start: yesterday,
      end: yesterday,
      keywords: ["yesterday", "yday", yesterday.format(MENTION_DATE_VALUE_FORMAT)],
    },
    {
      id: "date:last-3-days",
      displayName: "Last 3 days",
      start: lastThreeStart,
      end: today,
      keywords: ["last 3 days", "past 3 days", "3d", formatRangeValue(lastThreeStart, today)],
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
      ],
    },
    {
      id: "date:this-week",
      displayName: "This week",
      start: thisWeekStart,
      end: today,
      keywords: ["this week", "current week", "week", formatRangeValue(thisWeekStart, today)],
    },
    {
      id: "date:last-week",
      displayName: "Last week",
      start: lastWeekStart,
      end: lastWeekEnd,
      keywords: ["last week", "previous week", "lw", formatRangeValue(lastWeekStart, lastWeekEnd)],
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
