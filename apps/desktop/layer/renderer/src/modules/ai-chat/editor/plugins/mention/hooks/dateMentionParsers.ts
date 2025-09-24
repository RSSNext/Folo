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

const extractSearchTerms = (t: AiTFunction, key: string): string[] => {
  // Use a relaxed call signature to avoid strict key typing issues
  const tUnsafe: (key: string, options?: any) => unknown = (key, options) =>
    (t as unknown as (k: string, o?: any) => unknown)(key, options)
  const raw = tUnsafe(key, { returnObjects: true }) as unknown

  // Backward-compatible: if translations provided an array, keep supporting it
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === "string" ? item : String(item)))
      .map(sanitizeTerm)
      .filter(Boolean)
  }

  // Preferred: translations provide a single string; support multiple synonyms
  // delimited by common separators: |, comma (en/, zh ，), Japanese/Chinese lists (、), or newline
  const value = tUnsafe(key) as unknown
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

    // Use unsafe t signature for label key to avoid namespace mismatch typing
    const tUnsafeLabel: (key: string) => string = (key) =>
      (t as unknown as (k: string) => string)(key)
    addSearchTerm(terms, tUnsafeLabel(definition.labelKey))
    definition.searchKeys.forEach((key) => {
      extractSearchTerms(t, key).forEach((term) => addSearchTerm(terms, term))
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
  const labelText = resolveMentionLabel(
    candidate.label,
    // Relax i18n typing to a simple translator signature
    context.t,
  )
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

export const createDateMentionBuilder = (context: DateMentionBuilderContext) => {
  const candidates = buildRelativeCandidates(context)
  const fuse = new Fuse(candidates, FUSE_OPTIONS)

  return (query: string): MentionData[] => {
    const normalized = normalizeQuery(query)
    const today = dayjs().startOf("day")
    const bucket = normalized ? fuse.search(normalized).map((result) => result.item) : candidates

    const mentions: MentionData[] = []

    bucket.forEach((candidate) => {
      const range = candidate.definition.range(today)
      if (!range) return

      mentions.push(buildRangeMention(candidate, range, context))
    })

    return mentions
  }
}
