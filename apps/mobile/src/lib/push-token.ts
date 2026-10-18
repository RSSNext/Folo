import { api } from "@follow/store/context"
import { Platform } from "react-native"

/** How long a sign-out waits for the server to forget the device, so one offline is not held up */
const UNREGISTER_TIMEOUT_MS = 5000

/**
 * Stops push notifications to this device for the account signing out. The server keeps a
 * device's token until another account registers it, so without this the device would go on
 * getting the notifications of an account no longer signed in on it. Call it while the session
 * still authorizes the request.
 */
export const unregisterPushToken = async () => {
  try {
    await api().messaging.deleteToken({ channel: Platform.OS }, { timeout: UNREGISTER_TIMEOUT_MS })
  } catch (error) {
    console.warn(
      `[auth] Push token removal failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
