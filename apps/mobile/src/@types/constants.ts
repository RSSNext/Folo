const langs = ["en", "zh-CN"] as const
export const currentSupportedLanguages = langs as readonly string[]
export type MobileSupportedLanguages = (typeof langs)[number]

export const ns = ["default", "common", "lang", "errors"] as const
export const defaultNS = "default" as const

export const dayjsLocaleImportMap = {
  en: ["en", () => import("dayjs/locale/en")],
  ["zh-CN"]: ["zh-cn", () => import("dayjs/locale/zh-cn")],
  ["ja"]: ["ja", () => import("dayjs/locale/ja")],
  ["ru"]: ["ru", () => import("dayjs/locale/ru")],
  ["fi"]: ["fi", () => import("dayjs/locale/fi")],
  ["it"]: ["it", () => import("dayjs/locale/it")],
  ["ar-DZ"]: ["ar-dz", () => import("dayjs/locale/ar-dz")],
  ["ar-SA"]: ["ar-sa", () => import("dayjs/locale/ar-sa")],
  ["ar-MA"]: ["ar-ma", () => import("dayjs/locale/ar-ma")],
  ["es"]: ["es", () => import("dayjs/locale/es")],
  ["fr"]: ["fr", () => import("dayjs/locale/fr")],
  ["pt"]: ["pt", () => import("dayjs/locale/pt")],
  ["zh-TW"]: ["zh-tw", () => import("dayjs/locale/zh-tw")],
  ["ar-IQ"]: ["ar-iq", () => import("dayjs/locale/ar-iq")],
  ["ar-KW"]: ["ar-kw", () => import("dayjs/locale/ar-kw")],
  ["ar-TN"]: ["ar-tn", () => import("dayjs/locale/ar-tn")],
  ["zh-HK"]: ["zh-hk", () => import("dayjs/locale/zh-hk")],
  ["de"]: ["de", () => import("dayjs/locale/de")],
  ["ko"]: ["ko", () => import("dayjs/locale/ko")],
  ["tr"]: ["tr", () => import("dayjs/locale/tr")],
} as const
