import type { Dayjs } from "dayjs"
import dayjs from "dayjs"
import type { TFunction } from "i18next"

import { MENTION_DATE_VALUE_FORMAT } from "~/modules/ai-chat/utils/mentionDate"

import type { DateMentionData, MentionLabelDescriptor, MentionLabelValue } from "../types"
import type { RelativeDateDefinition } from "./dateMentionConfig"
import { RELATIVE_DATE_DEFINITIONS } from "./dateMentionConfig"

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
  const rangeStart = range.start.startOf("day")
  const startIso = rangeStart.format(MENTION_DATE_VALUE_FORMAT)

  const endExclusive = range.end.add(1, "day").startOf("day")
  const endIso = endExclusive.format(MENTION_DATE_VALUE_FORMAT)

  return `<mention-date start="${startIso}" end="${endIso}"></mention-date>`
}

const DEFAULT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
}

export const formatLocalizedDate = (
  date: Dayjs,
  locale: string,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_FORMAT,
): string => {
  return new Intl.DateTimeFormat(locale, options).format(date.toDate())
}

export const formatLocalizedRange = (
  range: DateRange,
  locale: string,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_FORMAT,
): string => {
  const startFormatted = formatLocalizedDate(range.start, locale, options)
  const endFormatted = formatLocalizedDate(range.end, locale, options)

  if (startFormatted === endFormatted) {
    return startFormatted
  }

  return `${startFormatted} – ${endFormatted}`
}

export type LabelTranslator = TFunction<"ai", undefined>

const isLabelDescriptor = (value: MentionLabelValue): value is MentionLabelDescriptor => {
  return typeof value === "object" && value !== null && "key" in value
}

const resolveLabelValue = (
  value: MentionLabelValue,
  translate: LabelTranslator,
): string | number | boolean => {
  if (isLabelDescriptor(value)) {
    return resolveMentionLabel(value, translate) ?? ""
  }
  return value
}

export const resolveMentionLabel = (
  label: MentionLabelDescriptor | undefined,
  translate: LabelTranslator,
): string | undefined => {
  if (!label) {
    return undefined
  }

  const resolvedValues = label.values
    ? Object.fromEntries(
        Object.entries(label.values).map(([key, value]) => [
          key,
          resolveLabelValue(value, translate),
        ]),
      )
    : undefined

  return translate(label.key, resolvedValues)
}

export const createDateMentionData = ({
  id,
  range,
  label,
  labelOptions,
  translate,
  displayName,
}: {
  id?: string
  range: DateRange
  label?: MentionLabelDescriptor
  labelOptions?: DateMentionData["labelOptions"]
  translate: LabelTranslator
  displayName?: string
}): DateMentionData => {
  const value = formatRangeValue(range)
  const text = value // Use the same value for text

  const resolvedName = displayName ?? resolveMentionLabel(label, translate) ?? value

  return {
    id: id ?? `date:${value}`,
    name: resolvedName,
    type: "date",
    value,
    text,
    label,
    labelOptions,
  }
}

export const parseRangeValue = (value: string): DateRange | null => {
  // Parse XML format: <mention-date start="YYYY-MM-DD" end="YYYY-MM-DD"></mention-date>
  const match = value.match(/start="([^"]+)"\s+end="([^"]+)"/)
  if (!match) return null

  const [, startIso, endIsoExclusive] = match
  if (!startIso || !endIsoExclusive) return null

  const start = dayjs(startIso, MENTION_DATE_VALUE_FORMAT, true)
  const endExclusive = dayjs(endIsoExclusive, MENTION_DATE_VALUE_FORMAT, true)
  if (!start.isValid() || !endExclusive.isValid()) return null

  const end = endExclusive.subtract(1, "day")
  return {
    start: start.startOf("day"),
    end: end.startOf("day"),
  }
}

export const getDateMentionDisplayName = (
  mention: Pick<DateMentionData, "label" | "labelOptions" | "value" | "name">,
  translate: LabelTranslator,
  locale: string,
  asRange = false,
): string => {
  // Only rely on value range to determine the display name
  if (typeof mention.value !== "string") {
    return mention.name
  }

  const range = parseRangeValue(mention.value)
  if (!range) {
    return mention.name
  }

  const today = dayjs().startOf("day")

  const isSameDay = (a: Dayjs, b: Dayjs) => a.isSame(b, "day")

  const matchRelative = (): RelativeDateDefinition | null => {
    for (const def of RELATIVE_DATE_DEFINITIONS) {
      const defRange = def.range(today)
      if (!defRange) continue
      if (isSameDay(defRange.start, range.start) && isSameDay(defRange.end, range.end)) {
        return def
      }
    }
    return null
  }

  const matched = matchRelative()
  if (matched && !asRange) {
    return translate(matched.labelKey)
  }

  // Fallback: show the localized date range only
  return formatLocalizedRange(range, locale)
}
