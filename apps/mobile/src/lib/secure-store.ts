import * as SecureStore from "expo-secure-store"
import Storage from "expo-sqlite/kv-store"

const fallbackPrefix = "follow_secure_store_fallback"
const warnedFallbackKeys = new Set<string>()
let forceFallback = false

const getFallbackKey = (key: string) => `${fallbackPrefix}:${key}`

const isSecureStoreUnavailable = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.message.includes("KeyChainException") ||
    error.message.includes("required entitlement") ||
    error.message.includes("keychain")
  )
}

const warnFallback = (action: "getItem" | "setItem", key: string, error: unknown) => {
  const warnKey = `${action}:${key}`
  if (warnedFallbackKeys.has(warnKey)) {
    return
  }

  warnedFallbackKeys.add(warnKey)

  if (!(error instanceof Error)) {
    console.warn(`[auth-storage] SecureStore ${action} fallback enabled for ${key}`)
    return
  }

  console.warn(`[auth-storage] SecureStore ${action} fallback enabled for ${key}: ${error.message}`)
}

const getFallbackValue = (key: string) => Storage.getItemSync(getFallbackKey(key))

export const safeSecureStore = {
  getItem(key: string) {
    if (forceFallback) {
      return getFallbackValue(key)
    }

    try {
      const value = SecureStore.getItem(key)
      if (value != null) {
        return value
      }
    } catch (error) {
      if (isSecureStoreUnavailable(error)) {
        forceFallback = true
        warnFallback("getItem", key, error)
        return getFallbackValue(key)
      }

      throw error
    }

    return getFallbackValue(key)
  },
  setItem(key: string, value: string) {
    if (forceFallback) {
      Storage.setItemSync(getFallbackKey(key), value)
      return
    }

    try {
      SecureStore.setItem(key, value)
      Storage.removeItemSync(getFallbackKey(key))
      return
    } catch (error) {
      if (isSecureStoreUnavailable(error)) {
        forceFallback = true
        warnFallback("setItem", key, error)
        Storage.setItemSync(getFallbackKey(key), value)
        return
      }

      throw error
    }
  },
}
