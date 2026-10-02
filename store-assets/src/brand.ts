// Brand tokens shared by every store asset. Values follow the folo.is landing
// page (apps/landing/src/styles/globals.css) so the listings and the website
// read as one product.

export const brand = {
  accent: "#FF5C00",
  accentSoft: "#FF8A3D",
  accentWarm: "#FFB273",
  ink: "#1B1512",
  inkSecondary: "#5E524B",
  inkTertiary: "#8C7F77",
  paper: "#FDFAF7",
  paperDeep: "#F8F0E9",
  night: "#171210",
  nightRaised: "#241C18",
  nightText: "#FBF4EE",
  nightTextSecondary: "#BCAEA5",
} as const

export type Tone = "light" | "dark"

// Latin text uses Geist like the landing page; CJK and Hangul fall back to the
// matching Noto Sans family so every locale keeps the same weight and color.
const fontStacks: Record<string, string> = {
  "zh-Hans": `"Geist", "Noto Sans SC", sans-serif`,
  "zh-Hant": `"Geist", "Noto Sans TC", sans-serif`,
  ja: `"Geist", "Noto Sans JP", sans-serif`,
  ko: `"Geist", "Noto Sans KR", sans-serif`,
}

export const fontStackFor = (locale: string) => fontStacks[locale] ?? `"Geist", sans-serif`

export const isCjkLocale = (locale: string) => locale in fontStacks

export const googleFontsHref =
  "https://fonts.googleapis.com/css2?family=Geist:wght@400..800&family=Noto+Sans+SC:wght@400..900&family=Noto+Sans+TC:wght@400..900&family=Noto+Sans+JP:wght@400..900&family=Noto+Sans+KR:wght@400..900&display=block"
