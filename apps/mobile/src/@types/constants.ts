const langs = ["en", "zh-CN"] as const
export const currentSupportedLanguages = langs as readonly string[]
export type MobileSupportedLanguages = (typeof langs)[number]

export const ns = ["default", "common", "lang", "errors"] as const
export const defaultNS = "default" as const
