import type { SupportedActionLanguage } from "@follow/shared/language"

export function getGenerateSummaryStatusId(
  entryId: string,
  actionLanguage: SupportedActionLanguage,
  target: "content" | "readabilityContent",
): StatusID {
  return `${entryId}-${actionLanguage}-${target}` as StatusID
}

export type StatusID = `${string}-${string}-${string}`
