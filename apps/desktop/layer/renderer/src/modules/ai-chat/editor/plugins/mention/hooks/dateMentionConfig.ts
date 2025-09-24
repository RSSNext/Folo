import type { Dayjs } from "dayjs"

import { clampRangeToPastMonth } from "./dateMentionUtils"

export const DATE_FORMATS = [
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

export const MAX_INLINE_DATE_SUGGESTIONS = 2

export interface WeekdayInfo {
  index: number
  english: string
  short: string
  chineseRoots: string[]
}

export const WEEKDAY_INFOS: readonly WeekdayInfo[] = [
  {
    index: 0,
    english: "Sunday",
    short: "Sun",
    chineseRoots: ["周日", "周天", "星期日", "星期天", "礼拜日", "礼拜天"],
  },
  { index: 1, english: "Monday", short: "Mon", chineseRoots: ["周一", "星期一", "礼拜一"] },
  { index: 2, english: "Tuesday", short: "Tue", chineseRoots: ["周二", "星期二", "礼拜二"] },
  { index: 3, english: "Wednesday", short: "Wed", chineseRoots: ["周三", "星期三", "礼拜三"] },
  { index: 4, english: "Thursday", short: "Thu", chineseRoots: ["周四", "星期四", "礼拜四"] },
  { index: 5, english: "Friday", short: "Fri", chineseRoots: ["周五", "星期五", "礼拜五"] },
  { index: 6, english: "Saturday", short: "Sat", chineseRoots: ["周六", "星期六", "礼拜六"] },
]

export const ENGLISH_THIS_WEEK_PREFIXES = new Set(["this", "this week", "current", "current week"])
export const ENGLISH_LAST_WEEK_PREFIXES = new Set([
  "last",
  "last week",
  "previous",
  "previous week",
])
export const CHINESE_THIS_WEEK_PREFIXES = new Set([
  "这周",
  "本周",
  "这星期",
  "本星期",
  "这礼拜",
  "本礼拜",
])
export const CHINESE_LAST_WEEK_PREFIXES = new Set([
  "上周",
  "上星期",
  "上一周",
  "上个星期",
  "上礼拜",
  "上个礼拜",
])

export const ENGLISH_WEEKDAY_MAP: Record<string, number> = Object.fromEntries(
  WEEKDAY_INFOS.flatMap((info) => [
    [info.english.toLowerCase(), info.index],
    [info.short.toLowerCase(), info.index],
  ]),
)

export const CHINESE_WEEKDAY_MAP: Record<string, number> = Object.fromEntries(
  WEEKDAY_INFOS.flatMap((info) => info.chineseRoots.map((root) => [root, info.index])),
)

export interface WeekdayAutoCompleteConfig {
  id: string
  dayIndex: number
  prefix: "this" | "last"
  displayName: string
  keywords: string[]
}

export const WEEKDAY_AUTOCOMPLETE_CONFIGS: WeekdayAutoCompleteConfig[] = WEEKDAY_INFOS.flatMap(
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
      ...baseEnglishKeywords,
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

export interface RelativeDateConfig {
  id: string
  displayName: string
  keywordSeeds: string[]
  range: (today: Dayjs) => ReturnType<typeof clampRangeToPastMonth>
}

export const RELATIVE_DATE_CONFIGS: RelativeDateConfig[] = [
  {
    id: "date:today",
    displayName: "Today",
    keywordSeeds: ["today", "tod", "今天", "今日"],
    range: (today) => clampRangeToPastMonth({ start: today, end: today }),
  },
  {
    id: "date:yesterday",
    displayName: "Yesterday",
    keywordSeeds: ["yesterday", "yday", "昨天", "昨日"],
    range: (today) => {
      const yesterday = today.subtract(1, "day")
      return clampRangeToPastMonth({ start: yesterday, end: yesterday })
    },
  },
  {
    id: "date:last-3-days",
    displayName: "Last 3 days",
    keywordSeeds: ["last 3 days", "past 3 days", "3d", "最近3天", "最近三天", "近3天", "近三天"],
    range: (today) => clampRangeToPastMonth({ start: today.subtract(2, "day"), end: today }),
  },
  {
    id: "date:last-7-days",
    displayName: "Last 7 days",
    keywordSeeds: [
      "last 7 days",
      "past 7 days",
      "past week",
      "7d",
      "最近7天",
      "最近七天",
      "近7天",
      "近七天",
      "近一周",
      "最近一周",
    ],
    range: (today) => clampRangeToPastMonth({ start: today.subtract(6, "day"), end: today }),
  },
  {
    id: "date:last-30-days",
    displayName: "Last 30 days",
    keywordSeeds: [
      "last 30 days",
      "past 30 days",
      "30d",
      "month",
      "最近30天",
      "最近三十天",
      "近30天",
      "近三十天",
      "近一个月",
      "最近一个月",
    ],
    range: (today) => clampRangeToPastMonth({ start: today.subtract(29, "day"), end: today }),
  },
  {
    id: "date:this-week",
    displayName: "This week",
    keywordSeeds: [
      "this week",
      "current week",
      "week",
      "这周",
      "本周",
      "这星期",
      "本星期",
      "这礼拜",
      "本礼拜",
    ],
    range: (today) => clampRangeToPastMonth({ start: today.startOf("week"), end: today }),
  },
  {
    id: "date:last-week",
    displayName: "Last week",
    keywordSeeds: [
      "last week",
      "previous week",
      "lw",
      "上周",
      "上一周",
      "上星期",
      "上个星期",
      "上礼拜",
      "上个礼拜",
    ],
    range: (today) => {
      const lastWeekStart = today.subtract(1, "week").startOf("week")
      const lastWeekEnd = lastWeekStart.add(6, "day")
      return clampRangeToPastMonth({ start: lastWeekStart, end: lastWeekEnd })
    },
  },
  {
    id: "date:this-month",
    displayName: "This month",
    keywordSeeds: ["this month", "current month", "month", "这个月", "本月", "这月"],
    range: (today) => clampRangeToPastMonth({ start: today.startOf("month"), end: today }),
  },
  {
    id: "date:last-month",
    displayName: "Last month",
    keywordSeeds: ["last month", "previous month", "上个月", "上月", "上一个月"],
    range: (today) => {
      const lastMonthStart = today.subtract(1, "month").startOf("month")
      const lastMonthEnd = lastMonthStart.endOf("month")
      return clampRangeToPastMonth({ start: lastMonthStart, end: lastMonthEnd })
    },
  },
]
