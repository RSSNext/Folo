import type { SpotlightRule } from "@follow/shared/spotlight"

const escapeRegExp = (value: string) => value.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&")

export interface CompiledSpotlightRule {
  id: string
  color: string
  regex: RegExp
}

export interface SpotlightPatternValidationResult {
  valid: true
  error?: never
}

export type SpotlightPatternValidationError =
  | { valid: false; reason: "empty" }
  | {
      valid: false
      reason: "regex"
      /** The regex engine's explanation, without its own "Invalid regular expression" prefix */
      error: string
    }

export type SpotlightPatternValidation =
  SpotlightPatternValidationResult | SpotlightPatternValidationError

export interface HighlightSegment {
  text: string
  highlight: null | {
    ruleId: string
    color: string
  }
}

export const validateSpotlightPattern = (
  pattern: string,
  patternType: SpotlightRule["patternType"],
): SpotlightPatternValidation => {
  if (!pattern.trim()) {
    return { valid: false, reason: "empty" }
  }

  if (patternType === "regex") {
    try {
      new RegExp(pattern)
    } catch (error) {
      // V8 says "Invalid regular expression: /[abc/: Unterminated character class"; the app
      // shows its own prefix, so keep only the explanation
      const message = error instanceof Error ? error.message : String(error)
      const explanation = message.replace(
        /^Invalid (?:regular expression|RegExp):\s*(?:\/.*\/[a-z]*:\s*)?/i,
        "",
      )
      return { valid: false, reason: "regex", error: explanation || message }
    }
  }

  return { valid: true }
}

export const compileSpotlightRules = (rules: SpotlightRule[]): CompiledSpotlightRule[] =>
  rules
    .filter((rule) => rule.enabled)
    .flatMap((rule) => {
      const validation = validateSpotlightPattern(rule.pattern, rule.patternType)
      if (!validation.valid) return []

      const source = rule.patternType === "keyword" ? escapeRegExp(rule.pattern) : rule.pattern
      const flags = rule.caseSensitive ? "g" : "gi"

      return [{ id: rule.id, color: rule.color, regex: new RegExp(source, flags) }]
    })

export const buildHighlightSegments = (
  text: string,
  rules: CompiledSpotlightRule[],
): HighlightSegment[] => {
  if (!text || rules.length === 0) return [{ text, highlight: null }]

  const claimed = Array.from({ length: text.length }, () => false)
  const segments: Array<{ start: number; end: number; ruleId: string; color: string }> = []

  for (const rule of rules) {
    const regex = new RegExp(rule.regex.source, rule.regex.flags)

    for (const match of text.matchAll(regex)) {
      const start = match.index ?? -1
      const value = match[0] ?? ""
      const end = start + value.length

      if (start < 0 || !value) continue
      if (claimed.slice(start, end).some(Boolean)) continue

      for (let index = start; index < end; index += 1) {
        claimed[index] = true
      }

      segments.push({ start, end, ruleId: rule.id, color: rule.color })
    }
  }

  if (segments.length === 0) return [{ text, highlight: null }]

  segments.sort((left, right) => left.start - right.start)

  const output: HighlightSegment[] = []
  let cursor = 0

  for (const segment of segments) {
    if (cursor < segment.start) {
      output.push({ text: text.slice(cursor, segment.start), highlight: null })
    }

    output.push({
      text: text.slice(segment.start, segment.end),
      highlight: { ruleId: segment.ruleId, color: segment.color },
    })
    cursor = segment.end
  }

  if (cursor < text.length) {
    output.push({ text: text.slice(cursor), highlight: null })
  }

  return output
}
