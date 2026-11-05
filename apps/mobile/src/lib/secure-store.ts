import * as SecureStore from "expo-secure-store"
import Storage from "expo-sqlite/kv-store"
import { Platform } from "react-native"

const fallbackPrefix = "follow_secure_store_fallback"
const warnedFallbackKeys = new Set<string>()
let forceFallback = false

/**
 * The keychain refused the item because the device is locked: its value is unknown, not
 * missing. The same read works again once the device is unlocked.
 */
export class SecureStoreLockedError extends Error {
  constructor(key: string, error: unknown) {
    super(
      `[auth-storage] SecureStore is locked for ${key}: ${error instanceof Error ? error.message : String(error)}`,
    )
    this.name = "SecureStoreLockedError"
  }
}

/**
 * iOS lets the app run while the device is locked (background tasks, audio, prewarming), but
 * items written with the default WHEN_UNLOCKED accessibility cannot be read then. Items are
 * written AFTER_FIRST_UNLOCK instead, under their own service: the keychain keeps the
 * accessibility of an existing item when its value is updated, so items written before move
 * there on their first read.
 */
const iosOptions: SecureStore.SecureStoreOptions = {
  keychainService: "folo.after-first-unlock",
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
}
// Keys whose item under the default service was moved, deleted or found missing
const legacyItemsChecked = new Set<string>()

const getFallbackKey = (key: string) => `${fallbackPrefix}:${key}`

// errSecInteractionNotAllowed
const isSecureStoreLocked = (error: unknown) =>
  error instanceof Error && error.message.includes("User interaction is not allowed")

const isSecureStoreUnavailable = (error: unknown) => {
  if (!(error instanceof Error) || isSecureStoreLocked(error)) {
    return false
  }

  return (
    error.message.includes("KeyChainException") ||
    error.message.includes("required entitlement") ||
    error.message.includes("keychain")
  )
}

const warnFallback = (
  action: "getItem" | "setItem" | "removeItem",
  key: string,
  error: unknown,
) => {
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

const deleteLegacyItem = async (key: string) => {
  try {
    await SecureStore.deleteItemAsync(key)
  } catch (error) {
    console.warn(
      `[auth-storage] SecureStore failed to delete the previous item for ${key}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

const moveLegacyItem = (key: string, value: string) => {
  try {
    SecureStore.setItem(key, value, iosOptions)
  } catch (error) {
    // The value stays where it is and moves on a later read
    console.warn(
      `[auth-storage] SecureStore failed to move ${key}: ${error instanceof Error ? error.message : String(error)}`,
    )
    return
  }
  legacyItemsChecked.add(key)
  void deleteLegacyItem(key)
}

const readKeychain = (key: string) => {
  if (Platform.OS !== "ios") {
    return SecureStore.getItem(key)
  }

  const value = SecureStore.getItem(key, iosOptions)
  if (value != null || legacyItemsChecked.has(key)) {
    return value
  }

  const legacyValue = SecureStore.getItem(key)
  if (legacyValue == null) {
    legacyItemsChecked.add(key)
    return null
  }

  moveLegacyItem(key, legacyValue)
  return legacyValue
}

const writeKeychain = (key: string, value: string) => {
  if (Platform.OS !== "ios") {
    SecureStore.setItem(key, value)
    return
  }

  SecureStore.setItem(key, value, iosOptions)
  if (!legacyItemsChecked.has(key)) {
    // Replaced by the value just written
    legacyItemsChecked.add(key)
    void deleteLegacyItem(key)
  }
}

const deleteSecureStoreItem = async (key: string) => {
  try {
    if (Platform.OS === "ios") {
      legacyItemsChecked.add(key)
      await Promise.all([
        SecureStore.deleteItemAsync(key, iosOptions),
        SecureStore.deleteItemAsync(key),
      ])
    } else {
      await SecureStore.deleteItemAsync(key)
    }
  } catch (error) {
    if (isSecureStoreUnavailable(error)) {
      forceFallback = true
      warnFallback("removeItem", key, error)
      return
    }

    console.warn(
      `[auth-storage] SecureStore removeItem failed for ${key}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

export const safeSecureStore = {
  /** @throws {SecureStoreLockedError} while the device is locked */
  getItem(key: string) {
    if (forceFallback) {
      return getFallbackValue(key)
    }

    try {
      const value = readKeychain(key)
      if (value != null) {
        return value
      }
    } catch (error) {
      if (isSecureStoreLocked(error)) {
        throw new SecureStoreLockedError(key, error)
      }

      if (isSecureStoreUnavailable(error)) {
        forceFallback = true
        warnFallback("getItem", key, error)
        return getFallbackValue(key)
      }

      throw error
    }

    return getFallbackValue(key)
  },
  /** @throws {SecureStoreLockedError} while the device is locked */
  setItem(key: string, value: string) {
    if (forceFallback) {
      Storage.setItemSync(getFallbackKey(key), value)
      return
    }

    try {
      writeKeychain(key, value)
      Storage.removeItemSync(getFallbackKey(key))
      return
    } catch (error) {
      if (isSecureStoreLocked(error)) {
        throw new SecureStoreLockedError(key, error)
      }

      if (isSecureStoreUnavailable(error)) {
        forceFallback = true
        warnFallback("setItem", key, error)
        Storage.setItemSync(getFallbackKey(key), value)
        return
      }

      throw error
    }
  },
  removeItem(key: string) {
    Storage.removeItemSync(getFallbackKey(key))

    if (forceFallback) {
      return
    }

    void deleteSecureStoreItem(key)
  },
  async removeItemAsync(key: string) {
    Storage.removeItemSync(getFallbackKey(key))

    if (forceFallback) {
      return
    }

    await deleteSecureStoreItem(key)
  },
}
