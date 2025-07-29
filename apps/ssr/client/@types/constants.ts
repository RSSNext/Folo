// DONT EDIT THIS FILE MANUALLY
const langs = ["en", "ja", "zh-CN", "zh-TW"] as const
export const currentSupportedLanguages = langs as readonly string[]
export type SSRSupportedLanguages = (typeof langs)[number]

export const dayjsLocaleImportMap = {
  en: ["en", () => import("dayjs/locale/en")],
  ["zh-CN"]: ["zh-cn", () => import("dayjs/locale/zh-cn")],
  ["ja"]: ["ja", () => import("dayjs/locale/ja")],
  ["zh-TW"]: ["zh-tw", () => import("dayjs/locale/zh-tw")],
}
export const ns = ["common", "external"] as const
export const defaultNS = "external" as const
