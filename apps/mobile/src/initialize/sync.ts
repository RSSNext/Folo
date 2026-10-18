import { syncEngine } from "@follow/store/sync/sync-engine"
import { transactionQueue } from "@follow/store/sync/transaction-queue"
import { AppState } from "react-native"

import { onApiRecovered } from "../lib/api-client"

const resumeSync = () => {
  transactionQueue.resume()
  syncEngine.resume()
}

/**
 * Retry pending mutations and pull server changes whenever the app returns to the foreground,
 * the device gets its connection back or the API answers again after an outage. The web build
 * listens to `online`, `focus` and `visibilitychange` on its own; React Native fires none of them.
 */
export const initSyncTriggers = () => {
  AppState.addEventListener("change", (state) => {
    if (state === "active") resumeSync()
  })

  onApiRecovered(resumeSync)

  // Loaded lazily, as the auth client does, so a binary without the module still starts.
  import("expo-network")
    .then(({ addNetworkStateListener, getNetworkStateAsync }) => {
      let connected: boolean | undefined
      addNetworkStateListener(({ isConnected }) => {
        const wasConnected = connected
        connected = isConnected
        // The event also fires for changes while connected; only a reconnect matters here.
        if (isConnected && wasConnected !== true) resumeSync()
      })
      getNetworkStateAsync()
        .then((state) => {
          connected ??= state.isConnected
        })
        .catch(() => {})
    })
    .catch((error) => {
      console.warn("[sync] the network state is not available", error)
    })
}
