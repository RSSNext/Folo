export type SupportedActionLanguage = "en" | "ja" | "zh-CN" | "zh-TW"
export const ACTION_LANGUAGE_MAP: Record<
  SupportedActionLanguage,
  {
    label: string
    value: string
    code?: string
  }
> = {
  // keep-sorted
  en: {
    label: "English",
    value: "en",
    code: "eng",
  },
  "zh-CN": {
    code: "cmn",
    label: "Simplified Chinese",
    value: "zh-CN",
  },
  "zh-TW": {
    label: "Traditional Chinese (Taiwan)",
    value: "zh-TW",
  },
  ja: {
    label: "Japanese",
    value: "ja",
    code: "jpn",
  },
}
export const ACTION_LANGUAGE_KEYS = Object.keys(ACTION_LANGUAGE_MAP) as SupportedActionLanguage[]
