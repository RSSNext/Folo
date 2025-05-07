import type { UserModel } from "@follow/models/types"

import { useUserStore } from "./store"

export const useUserById = (userId: string): UserModel | null =>
  useUserStore((state) => state.users[userId] || null)
