import Storage from "expo-sqlite/kv-store"
import type { SyncStorage } from "jotai/vanilla/utils/atomWithStorage"

export { createAtomAccessor, createAtomHooks, jotaiStore } from "@follow/utils"

export const JotaiPersistSyncStorage: SyncStorage<any> = {
  getItem: (key, defaultValue) => {
    const res = Storage.getItemSync(key)
    if (res === null) {
      return defaultValue
    }
    return JSON.parse(res)
  },
  setItem: (key, value) => {
    return Storage.setItemSync(key, JSON.stringify(value))
  },
  removeItem: (key) => {
    return Storage.removeItemSync(key)
  },
  subscribe() {
    return () => {}
  },
}
