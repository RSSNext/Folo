import { db } from "@follow/database/src/db"
import { translationsTable } from "@follow/database/src/schemas"
import type { TranslationSchema } from "@follow/database/src/schemas/types"
import { eq } from "drizzle-orm"

import { translationActions } from "../store/translation/store"
import type { Hydratable, Resetable } from "./internal/base"

class TranslationServiceStatic implements Hydratable, Resetable {
  async hydrate() {
    const translations = await db.query.translationsTable.findMany()
    translationActions.upsertManyInSession(translations)
  }
  async reset() {
    await db.delete(translationsTable).execute()
  }

  async insertTranslation(data: Omit<TranslationSchema, "createdAt">) {
    const updateExceptEmpty = Object.fromEntries(
      Object.entries({
        title: data.title,
        description: data.description,
        content: data.content,
        readabilityContent: data.readabilityContent,
      }).filter(([_, value]) => !!value),
    )

    await db
      .insert(translationsTable)
      .values({
        ...data,
        createdAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [translationsTable.entryId, translationsTable.language],
        set: updateExceptEmpty,
      })
  }

  async deleteTranslation(entryId: string) {
    await db.delete(translationsTable).where(eq(translationsTable.entryId, entryId))
  }
}

export const TranslationService = new TranslationServiceStatic()
