import type { SpotlightRule } from "@follow/shared/spotlight"

/**
 * Removes the rule `ruleId` when its pattern is blank, since such a rule highlights nothing.
 * Returns `rules` itself when there is nothing to remove.
 */
export const dropSpotlightRuleWithoutPattern = (rules: SpotlightRule[], ruleId: string) => {
  const rule = rules.find((item) => item.id === ruleId)
  if (!rule || rule.pattern.trim()) return rules

  return rules.filter((item) => item !== rule)
}
