export interface User {
  name: string | null
  id: string
  emailVerified: boolean | null
  image: string | null
  handle: string | null
  createdAt: string
}

export const deduplicateUsers = (users: User[]): User[] => {
  const userMap = new Map<string, User>()
  users.forEach((user) => {
    userMap.set(user.id, user)
  })
  return Array.from(userMap.values())
}
