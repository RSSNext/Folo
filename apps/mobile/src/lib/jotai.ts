import type { JotaiSyncStorage } from "@follow/utils"
import Storage from "expo-sqlite/kv-store"

export { createAtomAccessor, createAtomHooks, jotaiStore } from "@follow/utils"

export const JotaiPersistSyncStorage = {
  getItem: <Value>(key: string, defaultValue: Value): Value => {
    const res = Storage.getItemSync(key)
    if (res === null) {
      return defaultValue
    }
    return JSON.parse(res)
  },
  setItem: (key: string, value: unknown) => {
    return Storage.setItemSync(key, JSON.stringify(value))
  },
  removeItem: (key: string) => {
    return Storage.removeItemSync(key)
  },
  subscribe() {
    return () => {}
  },
} satisfies JotaiSyncStorage<unknown>
