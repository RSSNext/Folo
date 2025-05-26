import { db } from "@follow/database/src/db"
import { listsTable } from "@follow/database/src/schemas"
import type { ListSchema } from "@follow/database/src/schemas/types"
import { eq } from "drizzle-orm"

import { listActions } from "../store/list/store"
import type { Hydratable, Resetable } from "./internal/base"
import { conflictUpdateAllExcept } from "./internal/utils"

class ListServiceStatic implements Hydratable, Resetable {
  async reset() {
    await db.delete(listsTable).execute()
  }
  async hydrate() {
    const lists = await db.query.listsTable.findMany()
    listActions.upsertManyInSession(
      lists.map((list) => ({
        ...list,
        feedIds: JSON.parse(list.feedIds || "[]") as string[],
      })),
    )
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
}

export const ListService = new ListServiceStatic()
