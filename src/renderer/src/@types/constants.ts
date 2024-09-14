const langs = ["en", "ja", "zh-CN", "es"]
export const currentSupportedLanguages = langs.sort()
export const dayjsLocaleImportMap = {
  en: ["en", () => import("dayjs/locale/en")],
  ["zh-CN"]: ["zh-cn", () => import("dayjs/locale/zh-cn")],
  ["ja"]: ["ja", () => import("dayjs/locale/ja")],
  ["es"]: ["es", () => import("dayjs/locale/es")],
}
export const ns = ["app", "common", "lang", "settings", "shortcuts"] as const
export const defaultNS = "app" as const
