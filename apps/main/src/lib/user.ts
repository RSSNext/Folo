import type { User } from "@auth/core/types"
import type { Credentials } from "@eneris/push-receiver/dist/types"

import { logger } from "~/logger"

import { apiClient } from "./api-client"
import { store } from "./store"

const BetterAuthKey = "betterAuthSessionCookie"
export const setBetterAuthSessionCookie = (cookie: string) => store.set(BetterAuthKey, cookie)
export const getBetterAuthSessionCookie = () => store.get(BetterAuthKey)
export const cleanBetterAuthSessionCookie = () => store.set(BetterAuthKey, null)

const UserKey = "user"
export const setUser = (user: User) => store.set(UserKey, JSON.stringify(user))
export const getUser = (): User | null => {
  const user = store.get(UserKey)
  return user ? JSON.parse(user) : null
}

export const cleanUser = () => store.set(UserKey, null)

export const updateNotificationsToken = async (newCredentials?: Credentials) => {
  if (newCredentials) {
    store.set("notifications-credentials", newCredentials)
  }
  const credentials = newCredentials || store.get("notifications-credentials")
  if (credentials?.fcm?.token) {
    try {
      await apiClient.messaging.$post({
        json: {
          token: credentials.fcm.token,
          channel: "desktop",
        },
      })
    } catch (error) {
      logger.error("updateNotificationsToken error: ", error)
    }
  }
}
