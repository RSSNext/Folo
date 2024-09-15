const langs = ["en", "ja", "zh-CN", "zh-TW", "pt", "fr", "de"]
export const currentSupportedLanguages = langs.sort()
export const dayjsLocaleImportMap = {
  en: ["en", () => import("dayjs/locale/en")],
  ["zh-CN"]: ["zh-cn", () => import("dayjs/locale/zh-cn")],
  ["ja"]: ["ja", () => import("dayjs/locale/ja")],
  ["fr"]: ["fr", () => import("dayjs/locale/fr")],
  ["pt"]: ["pt", () => import("dayjs/locale/pt")],
  ["zh-TW"]: ["zh-tw", () => import("dayjs/locale/zh-tw")],
  ["de"]: ["de", () => import("dayjs/locale/de")],
}
export const ns = ["app", "common", "lang", "settings", "shortcuts"] as const
export const defaultNS = "app" as const
