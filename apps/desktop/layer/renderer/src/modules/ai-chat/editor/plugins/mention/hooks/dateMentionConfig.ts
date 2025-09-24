import type { Dayjs } from "dayjs"

import { clampRangeToPastMonth } from "./dateMentionUtils"

export const MAX_INLINE_DATE_SUGGESTIONS = 3

export type DateRangeFactory = (today: Dayjs) => ReturnType<typeof clampRangeToPastMonth>

export interface RelativeDateDefinition {
  id: string
  labelKey: I18nKeysForAi
  searchKeys: I18nKeysForAi[]
  range: DateRangeFactory
}

export const RELATIVE_DATE_DEFINITIONS: readonly RelativeDateDefinition[] = [
  {
    id: "date:relative:today",
    labelKey: "mentions.date.relative.today.label",
    searchKeys: ["mentions.date.relative.today.search"],
    range: (today) => clampRangeToPastMonth({ start: today, end: today }),
  },
  {
    id: "date:relative:yesterday",
    labelKey: "mentions.date.relative.yesterday.label",
    searchKeys: ["mentions.date.relative.yesterday.search"],
    range: (today) => {
      const target = today.subtract(1, "day")
      return clampRangeToPastMonth({ start: target, end: target })
    },
  },
  {
    id: "date:relative:last-3-days",
    labelKey: "mentions.date.relative.last_3_days.label",
    searchKeys: ["mentions.date.relative.last_3_days.search"],
    range: (today) => clampRangeToPastMonth({ start: today.subtract(2, "day"), end: today }),
  },
  {
    id: "date:relative:last-7-days",
    labelKey: "mentions.date.relative.last_7_days.label",
    searchKeys: ["mentions.date.relative.last_7_days.search"],
    range: (today) => clampRangeToPastMonth({ start: today.subtract(6, "day"), end: today }),
  },
  {
    id: "date:relative:last-30-days",
    labelKey: "mentions.date.relative.last_30_days.label",
    searchKeys: ["mentions.date.relative.last_30_days.search"],
    range: (today) => clampRangeToPastMonth({ start: today.subtract(29, "day"), end: today }),
  },
  {
    id: "date:relative:this-week",
    labelKey: "mentions.date.relative.this_week.label",
    searchKeys: ["mentions.date.relative.this_week.search"],
    range: (today) => clampRangeToPastMonth({ start: today.startOf("week"), end: today }),
  },
  {
    id: "date:relative:last-week",
    labelKey: "mentions.date.relative.last_week.label",
    searchKeys: ["mentions.date.relative.last_week.search"],
    range: (today) => {
      const start = today.subtract(1, "week").startOf("week")
      const end = start.add(6, "day")
      return clampRangeToPastMonth({ start, end })
    },
  },
  {
    id: "date:relative:this-month",
    labelKey: "mentions.date.relative.this_month.label",
    searchKeys: ["mentions.date.relative.this_month.search"],
    range: (today) => clampRangeToPastMonth({ start: today.startOf("month"), end: today }),
  },
  {
    id: "date:relative:last-month",
    labelKey: "mentions.date.relative.last_month.label",
    searchKeys: ["mentions.date.relative.last_month.search"],
    range: (today) => {
      const start = today.subtract(1, "month").startOf("month")
      const end = start.endOf("month")
      return clampRangeToPastMonth({ start, end })
    },
  },
]

export type WeekdayPrefix = "auto" | "this" | "last"

export interface WeekdayTranslationDescriptor {
  id: string
  index: number
  labelKey: string
  searchKey: string
}

export const RANGE_WITH_LABEL_KEY = "mentions.date.display.with_range"
