import type { UserModel } from "@follow/store/user/store"

export const deduplicateUsers = (users: UserModel[]): UserModel[] => {
  const userMap = new Map<string, UserModel>()
  users.forEach((user) => {
    userMap.set(user.id, user)
  })
  return Array.from(userMap.values())
}
