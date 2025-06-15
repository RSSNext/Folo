import type { SupportedActionLanguage } from "@follow/shared/language"

export function getGenerateSummaryStatusId(
  entryId: string,
  actionLanguage: SupportedActionLanguage,
  target: "content" | "readabilityContent",
) {
  return `${entryId}-${actionLanguage}-${target}`
}
