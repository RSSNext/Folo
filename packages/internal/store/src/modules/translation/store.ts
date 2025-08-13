import type { TranslationSchema } from "@follow/database/schemas/types"
import { TranslationService } from "@follow/database/services/translation"
import type { SupportedActionLanguage } from "@follow/shared"

import { apiClient } from "../../context"
import type { Hydratable, Resetable } from "../../lib/base"
import { createImmerSetter, createTransaction, createZustandStore } from "../../lib/helper"
import { getEntry } from "../entry/getter"
import type { EntryTranslation, TranslationFieldArray } from "./types"
import { translationFields } from "./types"

type TranslationModel = Omit<TranslationSchema, "createdAt">

interface TranslationState {
  data: Record<string, Partial<Record<SupportedActionLanguage, EntryTranslation>>>
}
const defaultState: TranslationState = {
  data: {},
}

export const useTranslationStore = createZustandStore<TranslationState>("translation")(
  () => defaultState,
)

const get = useTranslationStore.getState
const set = useTranslationStore.setState
const immerSet = createImmerSetter(useTranslationStore)

class TranslationActions implements Hydratable, Resetable {
  async hydrate() {
    const translations = await TranslationService.getTranslationToHydrate()
    translationActions.upsertManyInSession(translations)
  }

  async reset() {
    const tx = createTransaction()
    tx.store(() => {
      set(defaultState)
    })
    tx.persist(() => TranslationService.reset())

    await tx.run()
  }

  upsertManyInSession(translations: TranslationModel[]) {
    immerSet((state) => {
      translations.forEach((translation) => {
        if (!state.data[translation.entryId]) {
          state.data[translation.entryId] = {}
        }

        if (!state.data[translation.entryId]![translation.language]) {
          state.data[translation.entryId]![translation.language] = {
            title: null,
            description: null,
            content: null,
            readabilityContent: null,
          }
        }

        translationFields.forEach((field) => {
          if (translation[field]) {
            state.data[translation.entryId]![translation.language]![field] = translation[field]
          }
        })
      })
    })
  }

  async upsertMany(translations: TranslationModel[]) {
    this.upsertManyInSession(translations)

    await Promise.all(
      translations.map((translation) => TranslationService.insertTranslation(translation)),
    )
  }

  getTranslation(entryId: string, language: SupportedActionLanguage) {
    return get().data[entryId]?.[language]
  }
}

export const translationActions = new TranslationActions()

class TranslationSyncService {
  async generateTranslation({
    entryId,
    language,
    withContent,
    target,
    checkLanguage,
  }: {
    entryId: string
    language: SupportedActionLanguage
    withContent?: boolean
    target: "content" | "readabilityContent"
    checkLanguage: (params: { content: string; language: SupportedActionLanguage }) => boolean
  }) {
    const entry = getEntry(entryId)
    if (!entry) return
    const translationSession = translationActions.getTranslation(entryId, language)

    const fields = (
      ["title", "description", ...(withContent ? [target] : [])] as TranslationFieldArray
    ).filter((field) => {
      const content = entry[field]
      if (!content) return false

      if (translationSession?.[field]) return false

      return !checkLanguage({
        content,
        language,
      })
    })

    if (fields.length === 0) return null

    const res = await apiClient().ai.translation.$get({
      query: { id: entryId, language, fields: fields.join(",") },
    })

    if (!res.data) return null

    const translation: TranslationModel = {
      entryId,
      language,
      title: null,
      description: null,
      content: null,
      readabilityContent: null,
    }
    fields.forEach((field) => {
      translation[field] = res.data?.[field] ?? ""
    })

    await translationActions.upsertMany([translation])
    return translation
  }
}

export const translationSyncService = new TranslationSyncService()
