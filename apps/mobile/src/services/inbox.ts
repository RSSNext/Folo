import { db } from "@follow/database/src/db"
import { inboxesTable } from "@follow/database/src/schemas"
import type { InboxSchema } from "@follow/database/src/schemas/types"

import type { Resetable } from "./internal/base"
import { conflictUpdateAllExcept } from "./internal/utils"

class InboxServiceStatic implements Resetable {
  async reset() {
    await db.delete(inboxesTable).execute()
  }
  async getInbox(): Promise<InboxSchema[]> {
    return await db.select().from(inboxesTable)
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
