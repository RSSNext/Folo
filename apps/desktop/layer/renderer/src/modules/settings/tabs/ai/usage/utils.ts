import type { TokenCount } from "./types"

export const formatTokenCount = (count: number): TokenCount => {
  if (!Number.isFinite(count)) return { value: "0", unit: "" }
  if (count >= 1_000_000) return { value: (count / 1_000_000).toFixed(1), unit: "M" }
  if (count >= 1_000) return { value: (count / 1_000).toFixed(1), unit: "K" }
  return { value: String(Math.round(count)), unit: "" }
}

export const formatTimeRemaining = (ms: number): string => {
  if (!Number.isFinite(ms) || ms <= 0) return "0m"
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const rem = minutes % 60
  return rem ? `${hours}h ${rem}m` : `${hours}h`
}

export const formatTokenCountString = (count: number): string => {
  const formatted = formatTokenCount(count)
  return `${formatted.value}${formatted.unit}`
}
