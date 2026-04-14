export interface SpotlightRule {
  id: string
  enabled: boolean
  pattern: string
  patternType: "keyword" | "regex"
  caseSensitive: boolean
  color: string
}

export interface SpotlightColorPreset {
  value: string
}

export interface SpotlightSettings {
  spotlights: SpotlightRule[]
}

export const defaultSpotlightSettings: SpotlightSettings = {
  spotlights: [],
}

export const spotlightColorPresets: SpotlightColorPreset[] = [
  { value: "#FDE68A" },
  { value: "#FACC15" },
  { value: "#A3E635" },
  { value: "#67E8F9" },
  { value: "#E879F9" },
  { value: "#FB7185" },
  { value: "#FDBA74" },
  { value: "#A78BFA" },
  { value: "#60A5FA" },
  { value: "#5EEAD4" },
]

export const defaultSpotlightColor = spotlightColorPresets[0]!.value
export const spotlightHighlightOpacityHex = "99"

const normalizeSpotlightColor = (value: string) => value.trim().toUpperCase()

export const getSpotlightColorChoices = (color?: string | null): SpotlightColorPreset[] => {
  if (!color || typeof color !== "string") {
    return spotlightColorPresets
  }

  if (
    spotlightColorPresets.some(
      (preset) => normalizeSpotlightColor(preset.value) === normalizeSpotlightColor(color),
    )
  ) {
    return spotlightColorPresets
  }

  return [{ value: color }, ...spotlightColorPresets]
}

const isSpotlightsUpdated = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value)

const isSpotlightRule = (value: unknown): value is SpotlightRule => {
  if (!value || typeof value !== "object") return false

  const rule = value as Record<string, unknown>
  return (
    typeof rule.id === "string" &&
    typeof rule.enabled === "boolean" &&
    typeof rule.pattern === "string" &&
    (rule.patternType === "keyword" || rule.patternType === "regex") &&
    typeof rule.caseSensitive === "boolean" &&
    typeof rule.color === "string"
  )
}

export const toAppearanceSpotlightPayload = (
  settings: SpotlightSettings,
  spotlightsUpdated?: number,
) => ({
  spotlights: settings.spotlights.map((rule) => ({ ...rule })),
  ...(isSpotlightsUpdated(spotlightsUpdated) ? { spotlightsUpdated } : {}),
})

export const mergeAppearancePayloadWithSpotlightSettings = (
  appearancePayload: Record<string, unknown>,
  spotlightSettings: SpotlightSettings,
  spotlightsUpdated?: number,
) => ({
  ...appearancePayload,
  ...toAppearanceSpotlightPayload(spotlightSettings, spotlightsUpdated),
})

export const fromAppearanceSpotlightPayload = (
  payload?: Record<string, unknown> | null,
): SpotlightSettings => {
  if (!payload || typeof payload !== "object") {
    return {
      ...defaultSpotlightSettings,
      spotlights: [...defaultSpotlightSettings.spotlights],
    }
  }

  return {
    ...defaultSpotlightSettings,
    spotlights: Array.isArray(payload.spotlights)
      ? payload.spotlights.filter(isSpotlightRule).map((rule) => ({ ...rule }))
      : [...defaultSpotlightSettings.spotlights],
  }
}

export const pickSpotlightPayloadFromRemoteAppearance = (
  payload: Record<string, unknown>,
  updated: number,
) => ({
  ...fromAppearanceSpotlightPayload(payload),
  updated: isSpotlightsUpdated(payload.spotlightsUpdated) ? payload.spotlightsUpdated : updated,
})

export const moveSpotlightRule = (rules: SpotlightRule[], index: number, direction: -1 | 1) => {
  if (index < 0 || index >= rules.length) return rules

  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= rules.length) return rules

  const nextRules = [...rules]
  const [rule] = nextRules.splice(index, 1)
  nextRules.splice(nextIndex, 0, rule!)
  return nextRules
}
