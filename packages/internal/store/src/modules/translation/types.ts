import type { GeneralSettings } from "@follow/shared/settings/interface"

export const translationFields = ["title", "description", "content", "readabilityContent"] as const
export type TranslationField = (typeof translationFields)[number]
export type TranslationFieldArray = Array<TranslationField>
export type EntryTranslation = Record<TranslationField, string | null>
export type TranslationMode = GeneralSettings["translationMode"]
