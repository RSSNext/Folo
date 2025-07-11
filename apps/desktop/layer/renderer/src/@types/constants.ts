// DONT EDIT THIS FILE MANUALLY
const langs = ["en", "zh-CN", "zh-TW", "ja"] as const
export const currentSupportedLanguages = langs as readonly string[]
export type RendererSupportedLanguages = (typeof langs)[number]

export const dayjsLocaleImportMap = {
  en: ["en", () => import("dayjs/locale/en")],
  ["zh-CN"]: ["zh-cn", () => import("dayjs/locale/zh-cn")],
  ["ja"]: ["ja", () => import("dayjs/locale/ja")],
  ["zh-TW"]: ["zh-tw", () => import("dayjs/locale/zh-tw")],
}
export const ns = ["common", "lang", "errors", "app", "settings", "shortcuts", "ai"] as const
export const defaultNS = "app" as const
