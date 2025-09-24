import type { Dayjs } from "dayjs"
import dayjs from "dayjs"

import { MENTION_DATE_VALUE_FORMAT } from "~/modules/ai-chat/utils/mentionDate"

import type { MentionData } from "../types"

export interface DateRange {
  start: Dayjs
  end: Dayjs
}

export const clampRangeToPastMonth = (range: DateRange): DateRange | null => {
  const today = dayjs().startOf("day")
  const minAllowed = today.subtract(1, "month")

  if (range.start.isAfter(today)) {
    return null
  }

  const clampedEnd = range.end.isAfter(today) ? today : range.end
  if (clampedEnd.isBefore(minAllowed)) {
    return null
  }

  const clampedStart = range.start.isBefore(minAllowed) ? minAllowed : range.start

  if (clampedStart.isAfter(clampedEnd)) {
    return null
  }

  return { start: clampedStart.startOf("day"), end: clampedEnd.startOf("day") }
}

export const formatRangeValue = (range: DateRange): string => {
  const startIso = range.start.format(MENTION_DATE_VALUE_FORMAT)
  const endIso = range.end.format(MENTION_DATE_VALUE_FORMAT)
  return startIso === endIso ? startIso : `${startIso}..${endIso}`
}

export const createMentionFromRange = (
  range: DateRange,
  displayName: string | null,
  id?: string,
): MentionData => {
  const value = formatRangeValue(range)
  return {
    id: id ?? `date:${value}`,
    name: formatDisplayLabel(displayName, range),
    type: "date",
    value,
  }
}

export const formatDisplayLabel = (displayName: string | null, range: DateRange): string => {
  const rangeText = formatRangeText(range)

  if (!displayName) {
    return rangeText
  }

  return displayName.toLowerCase() === rangeText.toLowerCase()
    ? rangeText
    : `${displayName} (${rangeText})`
}

export const formatRangeText = (range: DateRange): string => {
  if (range.start.isSame(range.end, "day")) {
    return range.start.format("MMM D, YYYY")
  }

  if (range.start.year() === range.end.year()) {
    return `${range.start.format("MMM D")} – ${range.end.format("MMM D, YYYY")}`
  }

  return `${range.start.format("MMM D, YYYY")} – ${range.end.format("MMM D, YYYY")}`
}
