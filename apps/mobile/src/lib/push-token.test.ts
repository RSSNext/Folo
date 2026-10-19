import { apiContext } from "@follow/store/context"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PUSH_TOKEN_STORAGE_KEY, unregisterPushToken } from "./push-token"

const kvStore = new Map<string, string>()

vi.mock("react-native", () => ({ Platform: { OS: "ios" } }))
vi.mock("./kv", () => ({
  kv: {
    getSync: (key: string) => kvStore.get(key) ?? null,
    delete: async (key: string) => void kvStore.delete(key),
  },
}))

const deleteToken = vi.fn()

beforeEach(() => {
  kvStore.clear()
  deleteToken.mockReset()
  apiContext.provide({ messaging: { deleteToken } } as unknown as Parameters<
    typeof apiContext.provide
  >[0])
})

describe("unregisterPushToken", () => {
  it("asks the server to forget this platform's token, without waiting long", async () => {
    kvStore.set(PUSH_TOKEN_STORAGE_KEY, "device-token")
    deleteToken.mockResolvedValue({ code: 0 })

    await unregisterPushToken()

    expect(deleteToken).toHaveBeenCalledWith({ channel: "ios" }, { timeout: 5000 })
    expect(kvStore.has(PUSH_TOKEN_STORAGE_KEY)).toBe(false)
  })

  it("leaves the account's token alone when this device never registered one", async () => {
    await unregisterPushToken()

    // The server keeps one token per platform, which would be another device's
    expect(deleteToken).not.toHaveBeenCalled()
  })

  it("lets the sign-out go on when the server cannot be reached", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    kvStore.set(PUSH_TOKEN_STORAGE_KEY, "device-token")
    deleteToken.mockRejectedValue(new Error("fetch failed: offline"))

    await expect(unregisterPushToken()).resolves.toBeUndefined()
    // Still registered on the server, so a later sign-out asks again
    expect(kvStore.get(PUSH_TOKEN_STORAGE_KEY)).toBe("device-token")
  })
})
