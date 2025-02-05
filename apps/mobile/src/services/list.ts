import { eq } from "drizzle-orm"

import { db } from "../database"
import { listsTable } from "../database/schemas"
import type { ListSchema } from "../database/schemas/types"
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
  async addEntryIds(params: { listId: string; entryIds: string[] }) {
    const list = await db.query.listsTable.findFirst({
      where: eq(listsTable.id, params.listId),
    })

    if (!list) return

    await db
      .update(listsTable)
      .set({
        entryIds: [...new Set([...(list.entryIds ?? []), ...params.entryIds])],
      })
      .where(eq(listsTable.id, params.listId))
  }

  async deleteList(params: { listId: string }) {
    await db.delete(listsTable).where(eq(listsTable.id, params.listId))
  }
}

export const ListService = new ListServiceStatic()
