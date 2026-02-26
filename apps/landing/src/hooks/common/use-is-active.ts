import { useSyncExternalStore } from 'react'

const subscribe = (cb: () => void) => {
  document.addEventListener('visibilitychange', cb)
  return () => {
    document.removeEventListener('visibilitychange', cb)
  }
}

const getSnapshot = () => document.visibilityState === 'visible'
const getServerSnapshot = () => true
export const usePageIsActive = () => {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
