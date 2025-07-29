import { eq } from "drizzle-orm"

import { db } from "../db"
import { listsTable } from "../schemas"
import type { ListSchema } from "../schemas/types"
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

  async deleteList(listId: string) {
    await db.delete(listsTable).where(eq(listsTable.id, listId))
  }

  getListAll() {
    return db.query.listsTable.findMany()
  }
}

export const ListService = new ListServiceStatic()
