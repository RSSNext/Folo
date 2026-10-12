import { APP_STORE_URLS, GOOGLE_PLAY_PACKAGE_ID } from "@follow/constants"

import type { StorePolicyResponse } from "./client"

export interface StoreUpdateTarget {
  /** The store page that installs the new binary */
  url: string
  /** Opened first when the device can handle it, e.g. the Play Store app itself */
  appUrl?: string
  /** Picks the localized store name */
  store: "app_store" | "google_play"
}

/**
 * Where this install gets a new binary from, or null when it has no store to update from: an
 * APK installed outside Google Play has another signing key, so Play can't update it.
 */
export const getStoreUpdateTarget = ({
  platform,
  isGooglePlayInstall,
}: {
  platform: "ios" | "android"
  isGooglePlayInstall: boolean
}): StoreUpdateTarget | null => {
  if (platform === "ios") {
    return { url: APP_STORE_URLS.iOS, store: "app_store" }
  }
  if (!isGooglePlayInstall) return null
  return {
    url: APP_STORE_URLS.Android,
    appUrl: `market://details?id=${GOOGLE_PLAY_PACKAGE_ID}`,
    store: "google_play",
  }
}

/**
 * Whether the store policy asks to update the binary. A prompt the user put off for a version
 * stays quiet until a newer one is out; a block always asks.
 */
export const shouldPromptStoreUpdate = (
  policy: StorePolicyResponse | null,
  dismissedVersion: string | null,
): policy is StorePolicyResponse & { targetVersion: string } => {
  if (!policy?.targetVersion || policy.action === "none") return false
  if (policy.action === "block") return true
  return policy.targetVersion !== dismissedVersion
}
