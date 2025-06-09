import { eq } from "drizzle-orm"

import { db } from "../db"
import { usersTable } from "../schemas"
import type { UserSchema } from "../schemas/types"
import { conflictUpdateAllExcept } from "./internal/utils"

class UserServiceStatic {
  getUserAll() {
    return db.query.usersTable.findMany()
  }

  async upsertMany(users: UserSchema[]) {
    if (users.length === 0) return
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
