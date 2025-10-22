import * as chrono from "chrono-node"
import dayjs from "dayjs"
import type { IFuseOptions } from "fuse.js"
import Fuse from "fuse.js"
import type { TFunction } from "i18next"

import type { MentionData, MentionLabelDescriptor } from "../types"
import type { RelativeDateDefinition } from "./dateMentionConfig"
import { RANGE_WITH_LABEL_KEY, RELATIVE_DATE_DEFINITIONS } from "./dateMentionConfig"
import type { DateRange } from "./dateMentionUtils"
import {
  createDateMentionData,
  formatLocalizedRange,
  resolveMentionLabel,
} from "./dateMentionUtils"

type AiTFunction = TFunction<"ai">

interface DateMentionBuilderContext {
  t: AiTFunction
  language: string
}

interface RelativeDateCandidate {
  definition: RelativeDateDefinition
  label: MentionLabelDescriptor
  searchTerms: string[]
}

const FUSE_OPTIONS: IFuseOptions<RelativeDateCandidate> = {
  includeScore: true,
  threshold: 0.3,
  ignoreLocation: true,
  minMatchCharLength: 1,
  keys: ["searchTerms"],
}

const sanitizeTerm = (term: string): string => term.trim()

const addSearchTerm = (set: Set<string>, term: string) => {
  const cleaned = sanitizeTerm(term)
  if (!cleaned) return

  set.add(cleaned)
  const lowered = cleaned.toLowerCase()
  if (lowered !== cleaned) {
    set.add(lowered)
  }
}

const extractSearchTerms = (t: AiTFunction, key: string, lng?: string): string[] => {
  // Use a relaxed call signature to avoid strict key typing issues
  const tUnsafe: (key: string, options?: any) => unknown = (key, options) =>
    (t as unknown as (k: string, o?: any) => unknown)(key, options)
  const raw = tUnsafe(key, { returnObjects: true, lng }) as unknown

  // Backward-compatible: if translations provided an array, keep supporting it
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === "string" ? item : String(item)))
      .map(sanitizeTerm)
      .filter(Boolean)
  }

  // Preferred: translations provide a single string; support multiple synonyms
  // delimited by common separators: |, comma (en/, zh ，), Japanese/Chinese lists (、), or newline
  const value = tUnsafe(key, { lng }) as unknown
  if (typeof value !== "string") return []

  const pieces = value
    .split(/[|,，、\n]/g)
    .map(sanitizeTerm)
    .filter(Boolean)

  // If no delimiter found and non-empty, treat as single term
  return pieces.length > 0 ? pieces : [sanitizeTerm(value)].filter(Boolean)
}

const buildRelativeCandidates = ({ t }: DateMentionBuilderContext): RelativeDateCandidate[] => {
  return RELATIVE_DATE_DEFINITIONS.map<RelativeDateCandidate>((definition) => {
    const terms = new Set<string>()
    const label: MentionLabelDescriptor = { key: definition.labelKey }

    addSearchTerm(terms, t(definition.labelKey))
    // Always include English label as a searchable term
    const tUnsafeLabel: (key: string, options?: any) => string = (key, options) =>
      (t as unknown as (k: string, o?: any) => string)(key, options)
    addSearchTerm(terms, tUnsafeLabel(definition.labelKey, { lng: "en" }))
    definition.searchKeys.forEach((key) => {
      // Localized terms
      extractSearchTerms(t, key).forEach((term) => addSearchTerm(terms, term))
      // Always include English terms
      extractSearchTerms(t, key, "en").forEach((term) => addSearchTerm(terms, term))
    })

    return {
      definition,
      label,
      searchTerms: Array.from(terms),
    }
  })
}

const buildRangeMention = (
  candidate: RelativeDateCandidate,
  range: DateRange,
  context: DateMentionBuilderContext,
): MentionData => {
  const labelText = resolveMentionLabel(candidate.label, context.t)
  const rangeText = formatLocalizedRange(range, context.language)
  const appendRange = labelText
    ? labelText.localeCompare(rangeText, undefined, { sensitivity: "accent" }) !== 0
    : true

  return createDateMentionData({
    id: candidate.definition.id,
    range,
    label: candidate.label,
    labelOptions: appendRange ? { appendRange: true } : undefined,
    translate: context.t,
    locale: context.language,
    withRangeKey: RANGE_WITH_LABEL_KEY,
  })
}

const normalizeQuery = (query: string): string => {
  const trimmed = query.trim()
  if (!trimmed) return ""

  return trimmed.startsWith("@") ? trimmed.slice(1) : trimmed
}

/**
 * Get the appropriate chrono parser based on language
 */
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

/**
 * Parse natural language dates using chrono-node with language-specific parser
 * Returns a DateRange if the input can be parsed, otherwise null
 */
const parseNaturalLanguageDate = (query: string, language: string): DateRange | null => {
  if (!query.trim()) return null

  try {
    // Get language-specific parser
    const parser = getChronoParser(language)

    // Try to parse the date using chrono with language-specific parser first
    let parsed = parser.parse(query)

    // If failed and not already using English parser, try English as fallback
    if ((!parsed || parsed.length === 0) && parser !== chrono.en) {
      parsed = chrono.en.parse(query)
    }

    if (!parsed || parsed.length === 0) return null

    const result = parsed[0]
    if (!result) return null

    // Get the start date
    const startDate = result.start.date()
    const start = dayjs(startDate).startOf("day")

    // Check if there's an end date (for ranges)
    let end: dayjs.Dayjs
    if (result.end) {
      const endDate = result.end.date()
      end = dayjs(endDate).startOf("day")
    } else {
      // If no end date, use the start date as a single day
      end = start
    }

    // Validate the dates are valid
    if (!start.isValid() || !end.isValid()) return null

    // Ensure start is before or equal to end
    if (start.isAfter(end)) {
      return { start: end, end: start }
    }

    return { start, end }
  } catch {
    return null
  }
}

export const createDateMentionBuilder = (context: DateMentionBuilderContext) => {
  const candidates = buildRelativeCandidates(context)
  const fuse = new Fuse(candidates, FUSE_OPTIONS)

  return (query: string): MentionData[] => {
    const normalized = normalizeQuery(query)
    const today = dayjs().startOf("day")
    const mentions: MentionData[] = []

    // Try to parse as natural language date first
    if (normalized) {
      const naturalDateRange = parseNaturalLanguageDate(normalized, context.language)
      if (naturalDateRange) {
        // Successfully parsed a natural language date
        const chronoMention = createDateMentionData({
          range: naturalDateRange,
          translate: context.t,
          locale: context.language,
          withRangeKey: RANGE_WITH_LABEL_KEY,
          displayName: formatLocalizedRange(naturalDateRange, context.language),
        })
        mentions.push(chronoMention)
      }
    }

    // Add predefined relative date suggestions
    const bucket = normalized ? fuse.search(normalized).map((result) => result.item) : candidates

    bucket.forEach((candidate) => {
      const range = candidate.definition.range(today)
      if (!range) return

      mentions.push(buildRangeMention(candidate, range, context))
    })

    return mentions
  }
}
