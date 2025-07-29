const langs = ["en", "zh-CN", "zh-TW", "ja"] as const
export const currentSupportedLanguages = [...langs].sort() as string[]
export type MainSupportedLanguages = (typeof langs)[number]

export const ns = ["native"] as const
export const defaultNS = "native" as const
