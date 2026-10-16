import { beforeEach, describe, expect, it, vi } from "vitest"

const { kvStore, secureStore } = vi.hoisted(() => ({
  kvStore: new Map<string, string>(),
  secureStore: new Map<string, string>(),
}))

// expo-secure-store rejects keys with other characters
const assertValidSecureStoreKey = (key: string) => {
  if (!/^[\w.-]+$/.test(key)) throw new Error(`Invalid key provided to SecureStore: ${key}`)
}

vi.mock("./kv", () => ({
  kv: {
    get: async (key: string) => kvStore.get(key) ?? null,
    set: async (key: string, value: string) => void kvStore.set(key, value),
  },
}))

vi.mock("./secure-store", () => ({
  safeSecureStore: {
    getItem: (key: string) => {
      assertValidSecureStoreKey(key)
      return secureStore.get(key) ?? null
    },
    setItem: (key: string, value: string) => {
      assertValidSecureStoreKey(key)
      secureStore.set(key, value)
    },
  },
}))

const { hasFinishedOnboarding, markOnboardingFinished } = await import("./onboarding")

describe("onboarding flag", () => {
  beforeEach(() => {
    kvStore.clear()
    secureStore.clear()
  })

  it("reports a fresh install as not finished", async () => {
    await expect(hasFinishedOnboarding()).resolves.toBe(false)
  })

  it("remembers the onboarding after it finished", async () => {
    await markOnboardingFinished()
    await expect(hasFinishedOnboarding()).resolves.toBe(true)
  })

  it("restores the flag from the backup when the database was reset", async () => {
    await markOnboardingFinished()
    kvStore.clear()
    await expect(hasFinishedOnboarding()).resolves.toBe(true)
  })
})
