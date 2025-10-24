import * as chrono from "chrono-node"
import dayjs from "dayjs"

import { RELATIVE_DATE_DEFINITIONS } from "../hooks/dateMentionConfig"
import type { DateRange } from "../hooks/dateMentionUtils"

const getChronoParser = (language: string) => {
  if (language === "zh-CN") {
    return chrono.zh.hans
  }
  if (language === "zh-TW") {
    return chrono.zh.hant
  }
  if (language === "ja") {
    return chrono.ja
  }
  return chrono.en
}

export const parseNaturalLanguageDate = (query: string, language: string): DateRange | null => {
  if (!query.trim()) return null

  try {
    const parser = getChronoParser(language)
    let parsed = parser.parse(query)
    if ((!parsed || parsed.length === 0) && parser !== chrono.en) {
      parsed = chrono.en.parse(query)
    }

    if (!parsed || parsed.length === 0) return null
    const result = parsed[0]
    if (!result) return null

    const start = dayjs(result.start.date())
    const end = result.end ? dayjs(result.end.date()) : dayjs()

    if (!start.isValid() || !end.isValid()) return null
    if (start.isAfter(end)) {
      return { start: end, end: start }
    }
    return { start, end }
  } catch {
    return null
  }
}

export const parseDateRangeById = (id: string | undefined, language: string): DateRange | null => {
  if (!id) return null

  const relativeDef = RELATIVE_DATE_DEFINITIONS.find((def) => def.id === id)
  if (relativeDef) {
    const today = dayjs().startOf("day")
    return relativeDef.range(today)
  }

  return parseNaturalLanguageDate(id, language)
}
