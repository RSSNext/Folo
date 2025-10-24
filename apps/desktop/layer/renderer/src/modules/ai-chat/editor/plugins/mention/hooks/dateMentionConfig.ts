import type { Dayjs } from "dayjs"
import dayjs from "dayjs"

import type { DateRange } from "./dateMentionUtils"

export const MAX_INLINE_DATE_SUGGESTIONS = 2

export type DateRangeFactory = (today: Dayjs) => DateRange

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
    range: (today) => ({ start: today, end: dayjs() }),
  },
  {
    id: "date:relative:yesterday",
    labelKey: "mentions.date.relative.yesterday.label",
    searchKeys: ["mentions.date.relative.yesterday.search"],
    range: (today) => {
      const target = today.subtract(1, "day")
      return { start: target, end: target }
    },
  },
  {
    id: "date:relative:last-3-days",
    labelKey: "mentions.date.relative.last_3_days.label",
    searchKeys: ["mentions.date.relative.last_3_days.search"],
    range: (today) => ({ start: today.subtract(2, "day"), end: today }),
  },
  {
    id: "date:relative:last-7-days",
    labelKey: "mentions.date.relative.last_7_days.label",
    searchKeys: ["mentions.date.relative.last_7_days.search"],
    range: (today) => ({ start: today.subtract(6, "day"), end: today }),
  },
  {
    id: "date:relative:last-15-days",
    labelKey: "mentions.date.relative.last_15_days.label",
    searchKeys: ["mentions.date.relative.last_15_days.search"],
    range: (today) => ({ start: today.subtract(14, "day"), end: today }),
  },
  {
    id: "date:relative:last-30-days",
    labelKey: "mentions.date.relative.last_30_days.label",
    searchKeys: ["mentions.date.relative.last_30_days.search"],
    range: (today) => ({ start: today.subtract(29, "day"), end: today }),
  },
  {
    id: "date:relative:this-week",
    labelKey: "mentions.date.relative.this_week.label",
    searchKeys: ["mentions.date.relative.this_week.search"],
    range: (today) => ({ start: today.startOf("week"), end: today }),
  },
  {
    id: "date:relative:last-week",
    labelKey: "mentions.date.relative.last_week.label",
    searchKeys: ["mentions.date.relative.last_week.search"],
    range: (today) => {
      const start = today.subtract(1, "week").startOf("week")
      const end = start.add(6, "day")
      return { start, end }
    },
  },
  // Weekday in this week (future days are filtered by )
  {
    id: "date:relative:this-week-monday",
    labelKey: "mentions.date.weekday.day.monday.label",
    searchKeys: [
      "mentions.date.weekday.prefix.this.search",
      "mentions.date.weekday.day.monday.search",
    ],
    range: (today) => {
      const startOfWeek = today.startOf("week")
      const target = startOfWeek.add(1, "day")
      return { start: target, end: target }
    },
  },
  {
    id: "date:relative:this-week-tuesday",
    labelKey: "mentions.date.weekday.day.tuesday.label",
    searchKeys: [
      "mentions.date.weekday.prefix.this.search",
      "mentions.date.weekday.day.tuesday.search",
    ],
    range: (today) => {
      const startOfWeek = today.startOf("week")
      const target = startOfWeek.add(2, "day")
      return { start: target, end: target }
    },
  },
  {
    id: "date:relative:this-week-wednesday",
    labelKey: "mentions.date.weekday.day.wednesday.label",
    searchKeys: [
      "mentions.date.weekday.prefix.this.search",
      "mentions.date.weekday.day.wednesday.search",
    ],
    range: (today) => {
      const startOfWeek = today.startOf("week")
      const target = startOfWeek.add(3, "day")
      return { start: target, end: target }
    },
  },
  {
    id: "date:relative:this-week-thursday",
    labelKey: "mentions.date.weekday.day.thursday.label",
    searchKeys: [
      "mentions.date.weekday.prefix.this.search",
      "mentions.date.weekday.day.thursday.search",
    ],
    range: (today) => {
      const startOfWeek = today.startOf("week")
      const target = startOfWeek.add(4, "day")
      return { start: target, end: target }
    },
  },
  {
    id: "date:relative:this-week-friday",
    labelKey: "mentions.date.weekday.day.friday.label",
    searchKeys: [
      "mentions.date.weekday.prefix.this.search",
      "mentions.date.weekday.day.friday.search",
    ],
    range: (today) => {
      const startOfWeek = today.startOf("week")
      const target = startOfWeek.add(5, "day")
      return { start: target, end: target }
    },
  },
  {
    id: "date:relative:this-week-saturday",
    labelKey: "mentions.date.weekday.day.saturday.label",
    searchKeys: [
      "mentions.date.weekday.prefix.this.search",
      "mentions.date.weekday.day.saturday.search",
    ],
    range: (today) => {
      const startOfWeek = today.startOf("week")
      const target = startOfWeek.add(6, "day")
      return { start: target, end: target }
    },
  },
  {
    id: "date:relative:this-week-sunday",
    labelKey: "mentions.date.weekday.day.sunday.label",
    searchKeys: [
      "mentions.date.weekday.prefix.this.search",
      "mentions.date.weekday.day.sunday.search",
    ],
    range: (today) => {
      const startOfWeek = today.startOf("week")
      const target = startOfWeek.add(0, "day")
      return { start: target, end: target }
    },
  },

  {
    id: "date:relative:this-month",
    labelKey: "mentions.date.relative.this_month.label",
    searchKeys: ["mentions.date.relative.this_month.search"],
    range: (today) => ({ start: today.startOf("month"), end: today }),
  },
  {
    id: "date:relative:last-month",
    labelKey: "mentions.date.relative.last_month.label",
    searchKeys: ["mentions.date.relative.last_month.search"],
    range: (today) => {
      const start = today.subtract(1, "month").startOf("month")
      const end = start.endOf("month")
      return { start, end }
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
