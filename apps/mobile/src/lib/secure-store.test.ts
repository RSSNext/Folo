import { beforeEach, describe, expect, it, vi } from "vitest"

type Accessibility = "WHEN_UNLOCKED" | "AFTER_FIRST_UNLOCK"
type Options = { keychainService?: string; keychainAccessible?: Accessibility }

const mocks = vi.hoisted(() => ({
  os: "ios",
  /** "locked" hides WHEN_UNLOCKED items; before the first unlock every item is hidden */
  device: "unlocked" as "unlocked" | "locked" | "beforeFirstUnlock",
  keychain: new Map<string, { value: string; accessible: Accessibility }>(),
  fallback: new Map<string, string>(),
  failNextWrite: null as Error | null,
  failAll: null as Error | null,
}))

// What a native keychain error looks like once it reaches JavaScript
const keychainError = (reason: string) =>
  new Error(
    `FunctionCallException: Calling the 'getValueWithKeySync' function has failed\n→ Caused by: KeyChainException: ${reason}`,
  )
const lockedError = () => keychainError("User interaction is not allowed.")

const itemId = (key: string, options?: Options) => `${options?.keychainService ?? "app"}|${key}`

const assertReachable = (accessible: Accessibility) => {
  if (
    mocks.device === "beforeFirstUnlock" ||
    (mocks.device === "locked" && accessible === "WHEN_UNLOCKED")
  ) {
    throw lockedError()
  }
}

vi.mock("expo-secure-store", () => ({
  AFTER_FIRST_UNLOCK: "AFTER_FIRST_UNLOCK",
  getItem: vi.fn((key: string, options?: Options) => {
    if (mocks.failAll) throw mocks.failAll
    const item = mocks.keychain.get(itemId(key, options))
    if (!item) return null
    assertReachable(item.accessible)
    return item.value
  }),
  setItem: vi.fn((key: string, value: string, options?: Options) => {
    if (mocks.failAll) throw mocks.failAll
    if (mocks.failNextWrite) {
      const error = mocks.failNextWrite
      mocks.failNextWrite = null
      throw error
    }
    const id = itemId(key, options)
    const existing = mocks.keychain.get(id)
    // An update keeps the accessibility the item was created with
    const accessible = existing?.accessible ?? options?.keychainAccessible ?? "WHEN_UNLOCKED"
    assertReachable(accessible)
    mocks.keychain.set(id, { value, accessible })
  }),
  deleteItemAsync: vi.fn(async (key: string, options?: Options) => {
    mocks.keychain.delete(itemId(key, options))
  }),
}))
vi.mock("expo-sqlite/kv-store", () => ({
  default: {
    getItemSync: (key: string) => mocks.fallback.get(key) ?? null,
    setItemSync: (key: string, value: string) => void mocks.fallback.set(key, value),
    removeItemSync: (key: string) => void mocks.fallback.delete(key),
  },
}))
vi.mock("react-native", () => ({
  Platform: {
    get OS() {
      return mocks.os
    },
  },
}))

const newService = "folo.after-first-unlock"
const cookieKey = "follow_auth_cookie"
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

const loadSecureStore = async () => {
  vi.resetModules()
  return import("./secure-store")
}

describe("safeSecureStore", () => {
  beforeEach(() => {
    mocks.os = "ios"
    mocks.device = "unlocked"
    mocks.keychain.clear()
    mocks.fallback.clear()
    mocks.failNextWrite = null
    mocks.failAll = null
  })

  it("moves an item written before to an item readable while the device is locked", async () => {
    mocks.keychain.set(itemId(cookieKey), { value: "session", accessible: "WHEN_UNLOCKED" })
    const { safeSecureStore } = await loadSecureStore()

    expect(safeSecureStore.getItem(cookieKey)).toBe("session")
    await flush()

    expect(mocks.keychain.get(itemId(cookieKey, { keychainService: newService }))).toEqual({
      value: "session",
      accessible: "AFTER_FIRST_UNLOCK",
    })
    expect(mocks.keychain.has(itemId(cookieKey))).toBe(false)

    mocks.device = "locked"
    expect(safeSecureStore.getItem(cookieKey)).toBe("session")
  })

  it("reports a locked keychain as unknown and reads the item again once unlocked", async () => {
    mocks.keychain.set(itemId(cookieKey), { value: "session", accessible: "WHEN_UNLOCKED" })
    const { safeSecureStore, SecureStoreLockedError } = await loadSecureStore()

    mocks.device = "locked"
    expect(() => safeSecureStore.getItem(cookieKey)).toThrow(SecureStoreLockedError)
    // Not a missing keychain: nothing moves to the fallback storage
    expect(() => safeSecureStore.setItem("other_key", "value")).not.toThrow()
    expect(mocks.fallback.size).toBe(0)

    mocks.device = "unlocked"
    expect(safeSecureStore.getItem(cookieKey)).toBe("session")
  })

  it("throws while locked before the first unlock, for reads and writes", async () => {
    mocks.keychain.set(itemId(cookieKey, { keychainService: newService }), {
      value: "session",
      accessible: "AFTER_FIRST_UNLOCK",
    })
    const { safeSecureStore, SecureStoreLockedError } = await loadSecureStore()

    mocks.device = "beforeFirstUnlock"
    expect(() => safeSecureStore.getItem(cookieKey)).toThrow(SecureStoreLockedError)
    expect(() => safeSecureStore.setItem(cookieKey, "next")).toThrow(SecureStoreLockedError)

    mocks.device = "locked"
    expect(safeSecureStore.getItem(cookieKey)).toBe("session")
  })

  it("keeps the item written before when moving it fails, and moves it on a later read", async () => {
    mocks.keychain.set(itemId(cookieKey), { value: "session", accessible: "WHEN_UNLOCKED" })
    const { safeSecureStore } = await loadSecureStore()

    mocks.failNextWrite = keychainError("I/O error.")
    expect(safeSecureStore.getItem(cookieKey)).toBe("session")
    await flush()
    expect(mocks.keychain.get(itemId(cookieKey))?.value).toBe("session")

    expect(safeSecureStore.getItem(cookieKey)).toBe("session")
    await flush()
    expect(mocks.keychain.has(itemId(cookieKey))).toBe(false)
    expect(mocks.keychain.get(itemId(cookieKey, { keychainService: newService }))?.value).toBe(
      "session",
    )
  })

  it("writes readable-while-locked items and drops the item written before", async () => {
    mocks.keychain.set(itemId(cookieKey), { value: "old", accessible: "WHEN_UNLOCKED" })
    const { safeSecureStore } = await loadSecureStore()

    safeSecureStore.setItem(cookieKey, "new")
    await flush()

    expect(mocks.keychain.has(itemId(cookieKey))).toBe(false)
    expect(mocks.keychain.get(itemId(cookieKey, { keychainService: newService }))).toEqual({
      value: "new",
      accessible: "AFTER_FIRST_UNLOCK",
    })
    mocks.device = "locked"
    expect(safeSecureStore.getItem(cookieKey)).toBe("new")
  })

  it("removes the item in both places", async () => {
    mocks.keychain.set(itemId(cookieKey), { value: "old", accessible: "WHEN_UNLOCKED" })
    mocks.keychain.set(itemId(cookieKey, { keychainService: newService }), {
      value: "new",
      accessible: "AFTER_FIRST_UNLOCK",
    })
    const { safeSecureStore } = await loadSecureStore()

    await safeSecureStore.removeItemAsync(cookieKey)

    expect(mocks.keychain.size).toBe(0)
    expect(safeSecureStore.getItem(cookieKey)).toBeNull()
  })

  it("still falls back to local storage when the keychain is unavailable", async () => {
    mocks.fallback.set(`follow_secure_store_fallback:${cookieKey}`, "fallback-session")
    const { safeSecureStore } = await loadSecureStore()

    mocks.failAll = keychainError("A required entitlement isn't present.")
    expect(safeSecureStore.getItem(cookieKey)).toBe("fallback-session")
    safeSecureStore.setItem(cookieKey, "next")
    expect(mocks.fallback.get(`follow_secure_store_fallback:${cookieKey}`)).toBe("next")
  })

  it("keeps using the default store on Android", async () => {
    mocks.os = "android"
    const { safeSecureStore } = await loadSecureStore()
    const SecureStore = await import("expo-secure-store")

    safeSecureStore.setItem(cookieKey, "session")
    expect(safeSecureStore.getItem(cookieKey)).toBe("session")
    await safeSecureStore.removeItemAsync(cookieKey)

    expect(vi.mocked(SecureStore.setItem)).toHaveBeenLastCalledWith(cookieKey, "session")
    expect(vi.mocked(SecureStore.getItem)).toHaveBeenLastCalledWith(cookieKey)
    expect(vi.mocked(SecureStore.deleteItemAsync)).toHaveBeenLastCalledWith(cookieKey)
    expect(mocks.keychain.size).toBe(0)
  })
})
