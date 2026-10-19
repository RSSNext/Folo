import { api } from "@follow/store/context"
import { Platform } from "react-native"

import { kv } from "./kv"

/** Where the device keeps the push token it registered, once the server stored it */
export const PUSH_TOKEN_STORAGE_KEY = "firebase_messaging_token"

/** How long a sign-out waits for the server to forget the device, so one offline is not held up */
const UNREGISTER_TIMEOUT_MS = 5000

/**
 * Stops push notifications to this device for the account signing out. The server keeps a
 * device's token until another account registers it, so without this the device would go on
 * getting the notifications of an account no longer signed in on it. Call it while the session
 * still authorizes the request.
 *
 * The server keeps one token per platform for an account, so a device that never registered one
 * leaves it alone: it would remove the token of another device of the account on this platform.
 */
export const unregisterPushToken = async () => {
  try {
    if (!kv.getSync(PUSH_TOKEN_STORAGE_KEY)) return
    await api().messaging.deleteToken({ channel: Platform.OS }, { timeout: UNREGISTER_TIMEOUT_MS })
    await kv.delete(PUSH_TOKEN_STORAGE_KEY)
  } catch (error) {
    console.warn(
      `[auth] Push token removal failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
