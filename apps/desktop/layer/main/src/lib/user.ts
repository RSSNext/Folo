import type { Credentials } from "@eneris/push-receiver/dist/types"

import { isLinux, isMacOS, isWindows } from "~/env"
import { logger } from "~/logger"

import { apiClient } from "./api-client"
import { store } from "./store"

const notificationChannel = isMacOS
  ? "macos"
  : isWindows
    ? "windows"
    : isLinux
      ? "linux"
      : "desktop"

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
          channel: notificationChannel,
        },
      })
      logger.info("updateNotificationsToken success: ", credentials.fcm.token)
    } catch (error) {
      logger.error("updateNotificationsToken error: ", error)
    }
  }
}

export const deleteNotificationsToken = async () => {
  await apiClient.messaging.$delete({
    json: {
      channel: notificationChannel,
    },
  })
}
