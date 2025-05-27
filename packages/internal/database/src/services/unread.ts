import { db } from "../db"
import { unreadTable } from "../schemas"
import type { UnreadSchema } from "../schemas/types"
import type { Resetable } from "./internal/base"
import { conflictUpdateAllExcept } from "./internal/utils"

interface UnreadUpdateOptions {
  reset?: boolean
}

class UnreadServiceStatic implements Resetable {
  async reset() {
    await db.delete(unreadTable).execute()
  }

  async getUnreadAll() {
    return db.query.unreadTable.findMany()
  }

  async upsertMany(unreads: UnreadSchema[], options?: UnreadUpdateOptions) {
    if (unreads.length === 0) return
    await db.transaction(async (tx) => {
      if (options?.reset) {
        await tx.delete(unreadTable).execute()
      }
      await tx
        .insert(unreadTable)
        .values(unreads)
        .onConflictDoUpdate({
          target: [unreadTable.subscriptionId],
          set: conflictUpdateAllExcept(unreadTable, ["subscriptionId"]),
        })
    })
  }
}

export const UnreadService = new UnreadServiceStatic()
