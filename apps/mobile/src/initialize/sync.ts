import { syncEngine } from "@follow/store/sync/sync-engine"
import { transactionQueue } from "@follow/store/sync/transaction-queue"
import { t } from "i18next"
import { AppState } from "react-native"

import { onApiRecovered } from "../lib/api-client"
import { toastFetchError } from "../lib/error-parser"
import { refetchUnansweredQueries } from "../lib/query-client"
import { settingSyncQueue } from "../modules/settings/sync-queue"

const resumeSync = () => {
  transactionQueue.resume()
  syncEngine.resume()
  settingSyncQueue.resume()
  // A screen that could not load, such as an entry opened offline, would wait for a retry
  void refetchUnansweredQueries().catch(() => {})
}

/**
 * Retry pending mutations and setting changes, pull server changes and load again what failed to
 * load whenever the app returns to the foreground, the device gets its connection back or the API
 * answers again after an outage. The web build listens to `online`, `focus` and
 * `visibilitychange` on its own; React Native fires none of them.
 */
export const initSyncTriggers = () => {
  AppState.addEventListener("change", (state) => {
    if (state === "active") resumeSync()
  })

  onApiRecovered(resumeSync)

  // The change was shown as done, so undoing it without a word would look like a glitch.
  transactionQueue.onFailure(({ error }) => {
    toastFetchError(error instanceof Error ? error : new Error(String(error)), {
      title: t("common:sync.change_rejected"),
    })
  })

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
