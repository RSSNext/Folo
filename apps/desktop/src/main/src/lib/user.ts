import type { Credentials } from "@eneris/push-receiver/dist/types"
import type { UserModel } from "@follow/models"

import { isLinux, isMacOS, isWindows } from "~/env"
import { logger } from "~/logger"

import { apiClient } from "./api-client"
import { store } from "./store"

const BetterAuthKey = "betterAuthSessionCookie"
export const setBetterAuthSessionCookie = (cookie: string) => store.set(BetterAuthKey, cookie)
export const getBetterAuthSessionCookie = () => store.get(BetterAuthKey)
export const cleanBetterAuthSessionCookie = () => store.set(BetterAuthKey, null)

const UserKey = "user"
export const setUser = (user: UserModel) => store.set(UserKey, JSON.stringify(user))
export const getUser = (): UserModel | null => {
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
          channel: isMacOS ? "macos" : isWindows ? "windows" : isLinux ? "linux" : "desktop",
        },
      })
    } catch (error) {
      logger.error("updateNotificationsToken error: ", error)
    }
  }
}
