export const currentSupportedLanguages = ["en", "zh-CN"] as const
export type SupportedUILanguages = (typeof currentSupportedLanguages)[number]

export const ns = ["default", "common", "lang", "errors"] as const
export type MobileNamespaces = (typeof ns)[number]
export const defaultNS = "default" as const
