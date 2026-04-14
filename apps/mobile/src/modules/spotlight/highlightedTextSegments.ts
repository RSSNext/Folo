import type { SpotlightRule } from "@follow/shared/spotlight"
import { buildHighlightSegments, compileSpotlightRules } from "@follow/utils/spotlight"

export const getHighlightedTextSegments = (
  text: string | null | undefined,
  rules: SpotlightRule[],
) => buildHighlightSegments(text ?? "", compileSpotlightRules(rules))
