import { db } from "@follow/database/src/db"
import { usersTable } from "@follow/database/src/schemas"
import type { UserSchema } from "@follow/database/src/schemas/types"
import { eq } from "drizzle-orm"

import { userActions } from "../store/user/store"
import type { Hydratable } from "./internal/base"
import { conflictUpdateAllExcept } from "./internal/utils"

class UserServiceStatic implements Hydratable {
  async upsertMany(users: UserSchema[]) {
    await db
      .insert(usersTable)
      .values(users)
      .onConflictDoUpdate({
        target: [usersTable.id],
        set: conflictUpdateAllExcept(usersTable, ["id"]),
      })
  }

  async hydrate() {
    const users = await db.query.usersTable.findMany()
    userActions.upsertManyInSession(users)
  }

  async removeCurrentUser() {
    await db.update(usersTable).set({ isMe: false }).where(eq(usersTable.isMe, true))
  }
}

export const UserService = new UserServiceStatic()
