import { db } from "@follow/database/src/db"
import { usersTable } from "@follow/database/src/schemas"
import type { UserSchema } from "@follow/database/src/schemas/types"
import { eq } from "drizzle-orm"

import { conflictUpdateAllExcept } from "./internal/utils"

class UserServiceStatic {
  getUserAll() {
    return db.query.usersTable.findMany()
  }

  async upsertMany(users: UserSchema[]) {
    await db
      .insert(usersTable)
      .values(users)
      .onConflictDoUpdate({
        target: [usersTable.id],
        set: conflictUpdateAllExcept(usersTable, ["id"]),
      })
  }

  async removeCurrentUser() {
    await db.update(usersTable).set({ isMe: false }).where(eq(usersTable.isMe, true))
  }
}

export const UserService = new UserServiceStatic()
