import type { TranslationSchema } from "@follow/database/schemas/types"
import { TranslationService } from "@follow/database/services/translation"
import type { SupportedActionLanguage } from "@follow/shared"
import { checkLanguage } from "@follow/utils/language"
import { create, indexedResolver, windowScheduler } from "@yornaath/batshit"

import { api } from "../../context"
import type { Hydratable, Resetable } from "../../lib/base"
import { createImmerSetter, createTransaction, createZustandStore } from "../../lib/helper"
import { readNdjsonStream } from "../../lib/stream"
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
  private translationBatcher = create({
    fetcher: async (keys: string[]) => {
      // key format: `${entryId}|${language}|${target}|${fields}`
      type KeyParts = {
        entryId: string
        language: SupportedActionLanguage
        target: "content" | "readabilityContent"
        fields: string
      }

      const parseKey = (key: string): KeyParts => {
        const [entryId, language, target, fields] = key.split("|") as [
          string,
          SupportedActionLanguage,
          "content" | "readabilityContent",
          string,
        ]
        return { entryId, language, target, fields }
      }

      const requests = keys.map(parseKey)

      // Group by language + fields to minimize stream calls
      const groupKey = (r: KeyParts) => `${r.language}#${r.fields}`
      const grouped = new Map<
        string,
        {
          language: SupportedActionLanguage
          fields: string
          ids: string[]
          keyById: Record<string, string>
        }
      >()

      for (const r of requests) {
        const gk = groupKey(r)
        if (!grouped.has(gk)) {
          grouped.set(gk, { language: r.language, fields: r.fields, ids: [], keyById: {} })
        }
        const g = grouped.get(gk)!
        g.ids.push(r.entryId)
        g.keyById[r.entryId] = `${r.entryId}|${r.language}|${r.target}|${r.fields}`
      }

      const results: Record<string, TranslationModel | null> = {}

      // Execute each group sequentially to keep memory small; groups are already windowed by scheduler
      for (const [, group] of grouped) {
        try {
          const response = await api().ai.translationBatch({
            ids: group.ids,
            language: group.language,
            fields: group.fields,
          })

          await readNdjsonStream<{
            id: string
            data: Partial<Record<keyof TranslationModel, string>>
          }>(response, async (json) => {
            const key = group.keyById[json.id]
            if (!key) return

            const translation: TranslationModel = {
              entryId: json.id,
              language: group.language,
              title: null,
              description: null,
              content: null,
              readabilityContent: null,
            }

            const { title, description, content, readabilityContent } = json.data || {}
            if (typeof title === "string") translation.title = title
            if (typeof description === "string") translation.description = description
            if (typeof content === "string") translation.content = content
            if (typeof readabilityContent === "string")
              translation.readabilityContent = readabilityContent

            results[key] = translation
            await translationActions.upsertMany([translation])
          })
        } catch (e) {
          console.error("Translation stream request failed:", e)
        }
      }

      return results
    },
    resolver: indexedResolver(),
    scheduler: windowScheduler(1000),
  })

  async generateTranslation({
    entryId,
    language,
    withContent,
    target,
  }: {
    entryId: string
    language: SupportedActionLanguage
    withContent?: boolean
    target: "content" | "readabilityContent"
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

    const key = `${entryId}|${language}|${target}|${fields.join(",")}`
    const result = await this.translationBatcher.fetch(key)
    return result || null
  }
}

export const translationSyncService = new TranslationSyncService()
