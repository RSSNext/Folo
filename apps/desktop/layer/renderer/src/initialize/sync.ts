import { syncEngine } from "@follow/store/sync/sync-engine"
import { transactionQueue } from "@follow/store/sync/transaction-queue"

import { onApiRecovered } from "~/lib/api-client"

/**
 * Retry pending changes and pull server changes as soon as the API answers again after an
 * outage. The queue and the engine follow the browser's `online`, `focus` and visibility
 * events themselves, but none of them fires when the server was down while the network was up.
 */
export const initSyncTriggers = () => {
  onApiRecovered(() => {
    transactionQueue.resume()
    syncEngine.resume()
  })
}
