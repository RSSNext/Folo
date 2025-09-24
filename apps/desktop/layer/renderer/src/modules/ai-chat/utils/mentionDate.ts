import dayjs from "dayjs"

export const MENTION_DATE_VALUE_FORMAT = "YYYY-MM-DDTHH:mm:ssZ"

const LEGACY_MENTION_DATE_VALUE_FORMAT = "YYYY-MM-DD"

export interface MentionDateDisplay {
  label: string
  startISO: string | null
  endISO: string | null
  startLabel: string | null
  endLabel: string | null
}

const parseMentionBoundary = (raw: string) => {
  if (!raw) return null

  const direct = dayjs(raw)
  if (direct.isValid()) {
    return direct
  }

  const legacy = dayjs(raw, LEGACY_MENTION_DATE_VALUE_FORMAT, true)
  return legacy.isValid() ? legacy : null
}

const buildRangeLabel = (startISO: string, endISO: string): MentionDateDisplay => {
  const start = parseMentionBoundary(startISO)
  const end = parseMentionBoundary(endISO)

  if (!start || !end) {
    return {
      label: `${startISO}..${endISO}`,
      startISO: start ? startISO : null,
      endISO: end ? endISO : null,
      startLabel: start ? start.startOf("day").format("MMM D, YYYY") : null,
      endLabel: end ? end.startOf("day").format("MMM D, YYYY") : null,
    }
  }

  const normalizedStart = start.startOf("day")
  const normalizedEnd = end.startOf("day")

  const hasExclusiveEnd =
    normalizedEnd.isAfter(normalizedStart) &&
    end.hour() === 0 &&
    end.minute() === 0 &&
    end.second() === 0 &&
    end.millisecond() === 0

  const displayEnd = hasExclusiveEnd ? normalizedEnd.subtract(1, "day") : normalizedEnd

  const label = normalizedStart.isSame(displayEnd, "day")
    ? normalizedStart.format("MMM D, YYYY")
    : normalizedStart.year() === displayEnd.year()
      ? `${normalizedStart.format("MMM D")} – ${displayEnd.format("MMM D, YYYY")}`
      : `${normalizedStart.format("MMM D, YYYY")} – ${displayEnd.format("MMM D, YYYY")}`

  return {
    label,
    startISO: normalizedStart.format(MENTION_DATE_VALUE_FORMAT),
    endISO: normalizedEnd.format(MENTION_DATE_VALUE_FORMAT),
    startLabel: normalizedStart.format("MMM D, YYYY"),
    endLabel: displayEnd.format("MMM D, YYYY"),
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
