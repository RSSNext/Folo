import { getStorageNS } from "./ns"

const ATTRIBUTION_STORAGE_KEY = getStorageNS("attribution")

export interface AttributionData {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string

  // First seen at timestamp, for recording first attribution
  first_seen_at?: number
}

/**
 * Extract UTM parameters from URL search params
 */
export function extractUTMParams(searchParams: URLSearchParams): Partial<AttributionData> {
  const attribution: Partial<AttributionData> = {}

  const utmSource = searchParams.get("utm_source")
  const utmMedium = searchParams.get("utm_medium")
  const utmCampaign = searchParams.get("utm_campaign")
  const utmTerm = searchParams.get("utm_term")
  const utmContent = searchParams.get("utm_content")

  if (utmSource) attribution.utm_source = utmSource
  if (utmMedium) attribution.utm_medium = utmMedium
  if (utmCampaign) attribution.utm_campaign = utmCampaign
  if (utmTerm) attribution.utm_term = utmTerm
  if (utmContent) attribution.utm_content = utmContent

  return attribution
}

/**
 * Get attribution data from storage
 */
export function getAttributionData(): AttributionData | null {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem(ATTRIBUTION_STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored) as AttributionData
  } catch {
    return null
  }
}

/**
 * Save attribution data to storage (only if not already set, to preserve first attribution)
 */
export function saveAttributionData(data: Partial<AttributionData>): AttributionData | null {
  if (typeof window === "undefined") return null

  try {
    const existing = getAttributionData()
    const now = Date.now()

    // If we already have attribution data, don't overwrite it (preserve first attribution)
    if (existing && existing.first_seen_at) {
      return existing
    }

    // Merge with existing data, but set first_seen_at if not present
    const merged: AttributionData = {
      ...existing,
      ...data,
      first_seen_at: existing?.first_seen_at ?? now,
    }

    localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(merged))
    return merged
  } catch {
    return null
  }
}

/**
 * Capture attribution from current URL (browser only)
 */
export function captureAttributionFromURL(): AttributionData | null {
  try {
    const url = new URL(window.location.href)
    const utmParams = extractUTMParams(url.searchParams)

    // Only save if we have at least one UTM parameter
    if (Object.keys(utmParams).length > 0) {
      return saveAttributionData(utmParams)
    }

    return getAttributionData()
  } catch {
    return getAttributionData()
  }
}

/**
 * Capture attribution from a URL string (for deep links, etc.)
 */
export function captureAttributionFromURLString(urlString: string): AttributionData | null {
  if (typeof window === "undefined") return null

  try {
    const url = new URL(urlString)
    const utmParams = extractUTMParams(url.searchParams)

    // Only save if we have at least one UTM parameter
    if (Object.keys(utmParams).length > 0) {
      return saveAttributionData(utmParams)
    }

    return getAttributionData()
  } catch {
    return getAttributionData()
  }
}

/**
 * Get attribution data formatted for analytics (user properties)
 */
export function getAttributionForAnalytics(): Record<string, unknown> {
  const attribution = getAttributionData()
  if (!attribution) return {}

  const result: Record<string, unknown> = {}

  if (attribution.utm_source) result.utm_source = attribution.utm_source
  if (attribution.utm_medium) result.utm_medium = attribution.utm_medium
  if (attribution.utm_campaign) result.utm_campaign = attribution.utm_campaign
  if (attribution.utm_term) result.utm_term = attribution.utm_term
  if (attribution.utm_content) result.utm_content = attribution.utm_content
  if (attribution.first_seen_at) result.first_seen_at = attribution.first_seen_at

  // Add a computed channel field for easier filtering
  if (attribution.utm_source) {
    result.channel = attribution.utm_source
  }

  return result
}
