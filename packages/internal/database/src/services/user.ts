import { eq } from "drizzle-orm"

import { db } from "../db"
import { usersTable } from "../schemas"
import type { UserSchema } from "../schemas/types"
import type { Resetable } from "./internal/base"
import { conflictUpdateAllExcept } from "./internal/utils"

class UserServiceStatic implements Resetable {
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

  async reset() {
    await db.delete(usersTable).execute()
  }
}

export const UserService = new UserServiceStatic()
