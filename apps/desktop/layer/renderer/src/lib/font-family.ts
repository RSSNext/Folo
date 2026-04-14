const GENERIC_FONT_FAMILIES = new Set([
  "cursive",
  "emoji",
  "fangsong",
  "fantasy",
  "math",
  "monospace",
  "sans-serif",
  "serif",
  "system-ui",
  "ui-monospace",
  "ui-rounded",
  "ui-sans-serif",
  "ui-serif",
])

const CJK_FONT_FALLBACKS = [
  "PingFang SC",
  "Hiragino Sans GB",
  "Microsoft YaHei",
  "Noto Sans CJK SC",
]

const APP_FONT_FALLBACKS = ["SN Pro", ...CJK_FONT_FALLBACKS, "system-ui", "sans-serif"]

const normalizeFontFamily = (value: string) => {
  return value.trim().replaceAll(/^['"]|['"]$/g, "")
}

const serializeFontFamily = (value: string) => {
  const normalizedValue = normalizeFontFamily(value)

  if (GENERIC_FONT_FAMILIES.has(normalizedValue)) {
    return normalizedValue
  }

  return `"${normalizedValue.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`
}

export const buildAppFontFamily = (preferred?: string) => {
  const families = [preferred, ...APP_FONT_FALLBACKS]
  const seen = new Set<string>()

  return families
    .map((family) => family?.trim() ?? "")
    .filter(Boolean)
    .filter((family) => {
      const normalizedValue = normalizeFontFamily(family).toLowerCase()

      if (seen.has(normalizedValue)) {
        return false
      }

      seen.add(normalizedValue)
      return true
    })
    .map(serializeFontFamily)
    .join(", ")
}

export const DEFAULT_APP_FONT_FAMILY = buildAppFontFamily("system-ui")
