import { eq } from "drizzle-orm"

import { db } from "../db"
import { inboxesTable } from "../schemas"
import type { InboxSchema } from "../schemas/types"
import type { Resetable } from "./internal/base"
import { conflictUpdateAllExcept } from "./internal/utils"

class InboxServiceStatic implements Resetable {
  async reset() {
    await db.delete(inboxesTable).execute()
  }

  async deleteById(id: string) {
    await db.delete(inboxesTable).where(eq(inboxesTable.id, id)).execute()
  }

  getInboxAll() {
    return db.query.inboxesTable.findMany()
  }

  async upsertMany(inboxes: InboxSchema[]) {
    if (inboxes.length === 0) return
    await db
      .insert(inboxesTable)
      .values(inboxes)
      .onConflictDoUpdate({
        target: [inboxesTable.id],
        set: conflictUpdateAllExcept(inboxesTable, ["id"]),
      })
  }
}

export const InboxService = new InboxServiceStatic()
