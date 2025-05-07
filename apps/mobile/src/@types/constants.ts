const langs = ["en", "ja", "zh-CN", "zh-TW"] as const
export const currentSupportedLanguages = langs as readonly string[]
export type MobileSupportedLanguages = (typeof langs)[number]

export const ns = ["default", "common", "lang", "errors", "settings"] as const
export const defaultNS = "default" as const

export const dayjsLocaleImportMap = {
  en: ["en", () => import("dayjs/locale/en")],
  ["zh-CN"]: ["zh-cn", () => import("dayjs/locale/zh-cn")],
  ["ja"]: ["ja", () => import("dayjs/locale/ja")],
  ["zh-TW"]: ["zh-tw", () => import("dayjs/locale/zh-tw")],
} as const
