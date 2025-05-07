import { eq, inArray } from "drizzle-orm"

import { db } from "../database"
import { collectionsTable } from "../database/schemas"
import type { CollectionSchema } from "../database/schemas/types"
import { collectionActions } from "../store/collection/store"
import type { Hydratable, Resetable } from "./internal/base"
import { conflictUpdateAllExcept } from "./internal/utils"

class CollectionServiceStatic implements Hydratable, Resetable {
  async reset() {
    await db.delete(collectionsTable).execute()
  }

  async upsertMany(collections: CollectionSchema[]) {
    if (collections.length === 0) return
    await db
      .insert(collectionsTable)
      .values(collections)
      .onConflictDoUpdate({
        target: [collectionsTable.entryId],
        set: conflictUpdateAllExcept(collectionsTable, ["entryId"]),
      })
  }

  async delete(entryId: string) {
    await db.delete(collectionsTable).where(eq(collectionsTable.entryId, entryId))
  }

  getCollectionMany(entryId: string[]) {
    return db.query.collectionsTable.findMany({ where: inArray(collectionsTable.entryId, entryId) })
  }

  async hydrate() {
    const collections = await db.query.collectionsTable.findMany()
    collectionActions.upsertManyInSession(collections)
  }
}

export const CollectionService = new CollectionServiceStatic()
