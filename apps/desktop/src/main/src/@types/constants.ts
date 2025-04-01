const langs = ["en", "zh-CN", "zh-HK", "zh-TW", "ja"] as const
export const currentSupportedLanguages = [...langs].sort() as string[]
export type SupportedMainUILanguages = (typeof langs)[number]

export const ns = ["native"] as const
export const defaultNS = "native" as const
