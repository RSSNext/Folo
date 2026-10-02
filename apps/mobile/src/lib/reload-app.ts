import { reloadAppAsync } from "expo"

import { abortInFlightRequests, waitForNetworkIdle } from "./network-activity"
import { queryClient } from "./query-client"

const DRAIN_TIMEOUT_MS = 3_000
const SETTLE_DELAY_MS = 150

/**
 * Reload the JS runtime once no `expo/fetch` request is in flight.
 *
 * Reloading while a request is pending crashes the app: Expo's native fetch keeps a closure that
 * owns the JS promise until the response arrives, and destroying it after the runtime is gone
 * segfaults on the fetch queue. Cancelling the queries first keeps react-query from retrying,
 * aborting the requests makes the native side settle them, and the wait lets that happen.
 */
export const reloadApp = async (reason: string) => {
  await queryClient.cancelQueries().catch(() => {})
  abortInFlightRequests()
  await waitForNetworkIdle(DRAIN_TIMEOUT_MS)
  await new Promise((resolve) => setTimeout(resolve, SETTLE_DELAY_MS))
  await reloadAppAsync(reason)
}
