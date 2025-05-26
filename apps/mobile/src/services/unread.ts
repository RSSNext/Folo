import { db } from "@follow/database/src/db"
import { unreadTable } from "@follow/database/src/schemas"
import type { UnreadSchema } from "@follow/database/src/schemas/types"

import { unreadActions } from "../store/unread/store"
import type { UnreadUpdateOptions } from "../store/unread/types"
import type { Hydratable, Resetable } from "./internal/base"
import { conflictUpdateAllExcept } from "./internal/utils"

class UnreadServiceStatic implements Hydratable, Resetable {
  async reset() {
    await db.delete(unreadTable).execute()
  }
  async hydrate() {
    const unreads = await db.query.unreadTable.findMany()
    unreadActions.upsertManyInSession(unreads)
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
