import type { TranslationSchema } from "@/src/database/schemas/types"
import { apiClient } from "@/src/lib/api-fetch"
import type { SupportedLanguages } from "@/src/lib/language"
import { TranslationService } from "@/src/services/translation"

import { getEntry } from "../entry/getter"
import { createImmerSetter, createZustandStore } from "../internal/helper"
import type { EntryTranslation } from "./types"

type TranslationModel = Omit<TranslationSchema, "createdAt">

interface TranslationState {
  data: Record<string, Partial<Record<SupportedLanguages, EntryTranslation>>>
}
const emptyDataSet: Record<string, EntryTranslation> = {}

export const useTranslationStore = createZustandStore<TranslationState>("translation")(() => ({
  data: emptyDataSet,
}))

const get = useTranslationStore.getState
const immerSet = createImmerSetter(useTranslationStore)

class TranslationActions {
  upsertManyInSession(translations: TranslationModel[]) {
    translations.forEach((translation) => {
      immerSet((state) => {
        const translationData = {
          title: translation.title,
          description: translation.description,
          content: translation.content,
        }

        if (!state.data[translation.entryId]) {
          state.data[translation.entryId] = {}
        }

        state.data[translation.entryId]![translation.language] = translationData
      })
    })
  }

  async upsertMany(translations: TranslationModel[]) {
    this.upsertManyInSession(translations)

    for (const translation of translations) {
      TranslationService.insertTranslation(translation)
    }
  }

  getTranslation(entryId: string, language: SupportedLanguages) {
    return get().data[entryId]?.[language]
  }
}

export const translationActions = new TranslationActions()

class TranslationSyncService {
  async generateTranslation(entryId: string, language: SupportedLanguages) {
    const entry = getEntry(entryId)
    if (!entry) return

    const translationSession = translationActions.getTranslation(entryId, language)
    if (translationSession) return translationSession

    const res = await apiClient.ai.translation.$get({
      query: { id: entryId, language, fields: ["title", "description", "content"].join(",") },
    })

    if (!res.data) return null

    const translation: TranslationModel = {
      entryId,
      language,
      title: res.data.title || "",
      description: res.data.description || "",
      content: res.data.content || "",
    }

    await translationActions.upsertMany([translation])
    return translation
  }
}

export const translationSyncService = new TranslationSyncService()
