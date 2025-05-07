import { atom } from "jotai"

import { createAtomHooks } from "~/lib/jotai"

export enum NetworkStatus {
  ONLINE,
  OFFLINE,
}

export const [, , useNetworkStatus, , getNetworkStatus, setNetworkStatus] = createAtomHooks(
  atom(navigator.onLine ? NetworkStatus.ONLINE : NetworkStatus.OFFLINE),
)

export const [, , useApiStatus, , getApiStatus, setApiStatus] = createAtomHooks(
  atom(NetworkStatus.ONLINE),
)

export const subscribeNetworkStatus = () => {
  const handleOnline = () => setNetworkStatus(NetworkStatus.ONLINE)
  const handleOffline = () => setNetworkStatus(NetworkStatus.OFFLINE)

  window.addEventListener("online", handleOnline)
  window.addEventListener("offline", handleOffline)

  setNetworkStatus(navigator.onLine ? NetworkStatus.ONLINE : NetworkStatus.OFFLINE)

  return () => {
    window.removeEventListener("online", handleOnline)
    window.removeEventListener("offline", handleOffline)
  }
}
