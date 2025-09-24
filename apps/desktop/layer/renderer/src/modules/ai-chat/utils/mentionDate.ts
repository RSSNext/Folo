import dayjs from "dayjs"

export const MENTION_DATE_VALUE_FORMAT = "YYYY-MM-DD"

export interface MentionDateDisplay {
  label: string
  startISO: string | null
  endISO: string | null
  startLabel: string | null
  endLabel: string | null
}

const buildRangeLabel = (startISO: string, endISO: string): MentionDateDisplay => {
  const start = dayjs(startISO, MENTION_DATE_VALUE_FORMAT, true)
  const end = dayjs(endISO, MENTION_DATE_VALUE_FORMAT, true)

  if (!start.isValid() || !end.isValid()) {
    return {
      label: `${startISO}..${endISO}`,
      startISO: start.isValid() ? startISO : null,
      endISO: end.isValid() ? endISO : null,
      startLabel: start.isValid() ? start.format("MMM D, YYYY") : null,
      endLabel: end.isValid() ? end.format("MMM D, YYYY") : null,
    }
  }

  const normalizedStart = start.startOf("day")
  const normalizedEnd = end.startOf("day")
  const isRange = !normalizedStart.isSame(normalizedEnd, "day")

  const label = !isRange
    ? normalizedStart.format("MMM D, YYYY")
    : normalizedStart.year() === normalizedEnd.year()
      ? `${normalizedStart.format("MMM D")} – ${normalizedEnd.format("MMM D, YYYY")}`
      : `${normalizedStart.format("MMM D, YYYY")} – ${normalizedEnd.format("MMM D, YYYY")}`

  return {
    label,
    startISO: normalizedStart.format(MENTION_DATE_VALUE_FORMAT),
    endISO: normalizedEnd.format(MENTION_DATE_VALUE_FORMAT),
    startLabel: normalizedStart.format("MMM D, YYYY"),
    endLabel: normalizedEnd.format("MMM D, YYYY"),
  }
}

export const formatMentionDateValue = (value: string): MentionDateDisplay => {
  if (!value) {
    return {
      label: "",
      startISO: null,
      endISO: null,
      startLabel: null,
      endLabel: null,
    }
  }

  const parts = value.includes("..") ? value.split("..", 2) : [value, value]
  const rawStart = (parts[0] ?? value).trim()
  const rawEnd = (parts[1] ?? parts[0] ?? value).trim()

  return buildRangeLabel(rawStart, rawEnd)
}
