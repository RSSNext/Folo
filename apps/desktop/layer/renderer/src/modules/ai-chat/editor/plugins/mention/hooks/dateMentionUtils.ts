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

const formatRangeValue = (range: DateRange, text?: string): string => {
  const startIso = range.start.format(MENTION_DATE_VALUE_FORMAT)
  const endIso = range.end.format(MENTION_DATE_VALUE_FORMAT)

  return `<mention-date start="${startIso}" end="${endIso}"${text ? ` text="${text}"` : ""}></mention-date>`
}

const formatLocalizedDate = (date: Dayjs, locale: string, template = "LLL"): string => {
  return date.locale(locale).format(template)
}

export const formatLocalizedRange = (
  range: DateRange,
  locale: string,
  template?: string,
): string => {
  const startFormatted = formatLocalizedDate(range.start, locale, template)
  const endFormatted = formatLocalizedDate(range.end, locale, template)

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
  const value = formatRangeValue(range, id || displayName)
  const text = value // Use the same value for text

  const resolvedName = displayName ?? (resolveMentionLabel(label, translate) || "")

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

  const [, startIso, endIso] = match
  if (!startIso || !endIso) return null

  const start = dayjs(startIso, MENTION_DATE_VALUE_FORMAT, true)
  const end = dayjs(endIso, MENTION_DATE_VALUE_FORMAT, true)
  if (!start.isValid() || !end.isValid()) return null

  return { start, end }
}

export const getDateMentionDisplayName = (
  mention: Pick<DateMentionData, "label" | "labelOptions" | "value" | "name" | "id">,
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

  const matchRelative = (): RelativeDateDefinition | null => {
    for (const def of RELATIVE_DATE_DEFINITIONS) {
      if (def.id === mention.id) {
        return def
      }
    }
    return null
  }

  const matched = matchRelative()
  if (matched && !asRange) {
    return translate(matched.labelKey)
  }

  return asRange
    ? formatLocalizedRange(range, locale)
    : mention.name || formatLocalizedRange(range, locale, "LL")
}
