import { db } from "@follow/database/src/db"
import { listsTable } from "@follow/database/src/schemas"
import type { ListSchema } from "@follow/database/src/schemas/types"
import { eq } from "drizzle-orm"

import type { Resetable } from "./internal/base"
import { conflictUpdateAllExcept } from "./internal/utils"

class ListServiceStatic implements Resetable {
  async reset() {
    await db.delete(listsTable).execute()
  }

  async upsertMany(lists: ListSchema[]) {
    if (lists.length === 0) return
    await db
      .insert(listsTable)
      .values(lists)
      .onConflictDoUpdate({
        target: [listsTable.id],
        set: conflictUpdateAllExcept(listsTable, ["id"]),
      })
  }

  async deleteList(params: { listId: string }) {
    await db.delete(listsTable).where(eq(listsTable.id, params.listId))
  }

  getListAll() {
    return db.query.listsTable.findMany()
  }
}

export const ListService = new ListServiceStatic()
