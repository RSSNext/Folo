import { FollowAPIError } from "@follow-app/client-sdk"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  // Read by the shared constants at import
  vi.stubGlobal("ELECTRON", false)
  return {
    kv: new Map<string, string>(),
    settingsGet: vi.fn(),
    settingsUpdate: vi.fn(),
  }
})

vi.mock("@/src/lib/kv", () => ({
  kv: {
    get: async (key: string) => mocks.kv.get(key) ?? null,
    getSync: (key: string) => mocks.kv.get(key) ?? null,
    set: (key: string, value: string) => {
      mocks.kv.set(key, value)
    },
    setSync: (key: string, value: string) => {
      mocks.kv.set(key, value)
    },
    delete: async (key: string) => {
      mocks.kv.delete(key)
    },
  },
}))

vi.mock("@/src/lib/api-client", () => ({
  followClient: {
    api: { settings: { get: mocks.settingsGet, update: mocks.settingsUpdate } },
  },
}))

vi.mock("@follow/store/user/getters", () => ({
  whoami: () => ({ id: "user-1" }),
}))

vi.mock("@follow/tracker", () => ({
  tracker: { manager: { captureException: vi.fn() } },
}))

// Setting changes go through `enqueue` here; the bus listens on the window, which is not here.
vi.mock("@follow/utils/event-bus", () => ({
  EventBus: { subscribe: () => () => {} },
}))

// The setting atoms read the device language and storage at import; plain atoms stand in.
vi.mock("@/src/atoms/settings/general", async () => {
  const { atom } = await import("jotai")
  const { jotaiStore } = await import("@follow/utils")
  const createDefaultGeneralSettings = () => ({ actionLanguage: "default", language: "en" })
  const __generalSettingAtom = atom<Record<string, unknown>>(createDefaultGeneralSettings())
  return {
    __generalSettingAtom,
    createDefaultGeneralSettings,
    generalLocalOnlyKeys: ["language"],
    getGeneralSettings: () => jotaiStore.get(__generalSettingAtom),
  }
})

vi.mock("@/src/atoms/settings/ui", async () => {
  const { atom } = await import("jotai")
  const { jotaiStore } = await import("@follow/utils")
  const createDefaultSettings = () => ({})
  const __uiSettingAtom = atom<Record<string, unknown>>(createDefaultSettings())
  return {
    __uiSettingAtom,
    createDefaultSettings,
    getUISettings: () => jotaiStore.get(__uiSettingAtom),
    uiLocalOnlyKeys: [],
  }
})

vi.mock("@/src/atoms/settings/spotlight", async () => {
  const { atom } = await import("jotai")
  const { jotaiStore } = await import("@follow/utils")
  const __spotlightSettingAtom = atom<Record<string, unknown>>({ spotlights: [] })
  return {
    __spotlightSettingAtom,
    getSpotlightSettings: () => jotaiStore.get(__spotlightSettingAtom),
    spotlightServerSyncWhiteListKeys: ["spotlights"],
  }
})

const { settingSyncQueue } = await import("./sync-queue")

describe("mobile setting sync", () => {
  beforeEach(async () => {
    vi.useFakeTimers()
    mocks.kv.clear()
    // Settings changed on this device went to the account already.
    mocks.kv.set("setting_sync_local_first_user-1", "1")
    mocks.settingsGet.mockResolvedValue({ code: 0, settings: {}, updated: {} })
    mocks.settingsUpdate.mockReset()
    await settingSyncQueue.init()
  })

  afterEach(() => {
    settingSyncQueue.teardown()
    vi.useRealTimers()
  })

  it("retries a change that failed to send with back-off until it goes through", async () => {
    mocks.settingsUpdate
      .mockRejectedValueOnce(
        new Error("fetch failed: The Internet connection appears to be offline."),
      )
      .mockRejectedValueOnce(new FollowAPIError("unavailable", 503))
      .mockResolvedValue({ code: 0 })

    void settingSyncQueue.enqueue("general", { actionLanguage: "fr-FR" })

    await vi.advanceTimersByTimeAsync(1000)
    expect(mocks.settingsUpdate).toHaveBeenCalledTimes(1)
    // One second of back-off, then the flush delay
    await vi.advanceTimersByTimeAsync(2000)
    expect(mocks.settingsUpdate).toHaveBeenCalledTimes(2)
    // Two seconds of back-off, then the flush delay
    await vi.advanceTimersByTimeAsync(3000)
    expect(mocks.settingsUpdate).toHaveBeenCalledTimes(3)
    expect(mocks.settingsUpdate).toHaveBeenLastCalledWith({
      tab: "general",
      actionLanguage: "fr-FR",
    })
    expect(settingSyncQueue.queue).toEqual([])
    // Nothing is left in storage for the next launch to send again.
    expect(mocks.kv.has("setting_sync_queue")).toBe(false)
  })

  it("sends a waiting change at once on resume and starts the back-off over", async () => {
    mocks.settingsUpdate.mockRejectedValue(new Error("fetch failed: offline"))

    void settingSyncQueue.enqueue("general", { actionLanguage: "fr-FR" })
    // Failures at 1, 3, 6 and 11 s: the next try is eight seconds of back-off away
    await vi.advanceTimersByTimeAsync(11_000)
    expect(mocks.settingsUpdate).toHaveBeenCalledTimes(4)

    mocks.settingsUpdate.mockResolvedValue({ code: 0 })
    settingSyncQueue.resume()
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.settingsUpdate).toHaveBeenCalledTimes(5)
    expect(settingSyncQueue.queue).toEqual([])
  })
})
