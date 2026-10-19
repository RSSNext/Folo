import type { Credentials } from "@eneris/push-receiver/dist/types"
import { FollowAPIError } from "@follow-app/client-sdk"

import { isLinux, isMacOS, isWindows } from "~/env"
import { logger } from "~/logger"

import { apiClient } from "./api-client"
import { getSessionTokenFromCookies } from "./cli-session-sync"
import { store } from "./store"

const notificationChannel = isMacOS
  ? "macos"
  : isWindows
    ? "windows"
    : isLinux
      ? "linux"
      : "desktop"

// Retries of an upload that failed for a passing reason, e.g. while the API was unreachable.
// After the last one, the next push connection, at launch or after a reconnect, tries again.
const RETRY_DELAYS = [10_000, 60_000, 5 * 60_000, 15 * 60_000]

let retryTimer: ReturnType<typeof setTimeout> | undefined
let retryCount = 0

const cancelRetry = () => {
  clearTimeout(retryTimer)
  retryTimer = undefined
}

/** Network failures, timeouts, rate limits and server errors, which may pass on their own */
const isTransientError = (error: unknown) =>
  !(error instanceof FollowAPIError) ||
  error.status === 408 ||
  error.status === 429 ||
  error.status >= 500

/** Sends the push token to the server, the stored one unless new credentials come with the call */
export const updateNotificationsToken = async (newCredentials?: Credentials) => {
  if (newCredentials) {
    store.set("notifications-credentials", newCredentials)
  }
  const credentials = newCredentials || store.get("notifications-credentials")
  const token = credentials?.fcm?.token
  if (!token) return

  cancelRetry()
  try {
    await apiClient.messaging.createToken({
      token,
      channel: notificationChannel,
    })
    retryCount = 0
    store.set("notifications-token-sent", token)
    logger.info("Notification token updated successfully")
  } catch (error) {
    store.delete("notifications-token-sent")
    if (error instanceof FollowAPIError && error.status === 401) {
      // Signing in sends the token
      retryCount = 0
      logger.info("Notification token not sent while signed out")
      return
    }
    if (!isTransientError(error) || retryCount >= RETRY_DELAYS.length) {
      retryCount = 0
      logger.error("Failed to update notification token")
      return
    }

    const delay = RETRY_DELAYS[retryCount]!
    retryCount++
    logger.error(`Failed to update notification token, retrying in ${delay / 1000} s`)
    retryTimer = setTimeout(() => {
      void updateNotificationsToken()
    }, delay)
  }
}

/**
 * Sends the stored push token unless the server already has it. A device whose upload failed,
 * e.g. while the API was unreachable, would otherwise get no notifications until the next
 * sign-in.
 */
export const ensureNotificationsTokenSent = async () => {
  const token = store.get("notifications-credentials")?.fcm?.token
  if (!token || store.get("notifications-token-sent") === token) return
  // Signed out, the upload can only fail, at every push connection. Signing in sends the token.
  if (!(await getSessionTokenFromCookies())) return
  await updateNotificationsToken()
}

export const deleteNotificationsToken = async () => {
  // A pending retry would register the device again for the account that signs out
  cancelRetry()
  retryCount = 0
  store.delete("notifications-token-sent")
  await apiClient.messaging.deleteToken({
    channel: notificationChannel,
  })
}
