const langs = ["en", "zh-CN", "zh-HK", "zh-TW", "ja"] as const
export const currentSupportedLanguages = [...langs].sort() as string[]
export type SupportedLanguages = (typeof langs)[number]

export const ns = ["native"] as const
export const defaultNS = "native" as const
