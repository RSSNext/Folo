import type { AppStateStatus } from "react-native"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const appStateListeners = new Set<(state: AppStateStatus) => void>()
  const networkListeners = new Set<(state: { isConnected?: boolean }) => void>()
  const apiRecoveredListeners = new Set<() => void>()
  const failureListeners = new Set<(event: { records: unknown[]; error: unknown }) => void>()
  return {
    appStateListeners,
    networkListeners,
    apiRecoveredListeners,
    failureListeners,
    toastFetchError: vi.fn(),
    networkState: { isConnected: true as boolean | undefined },
    queueResume: vi.fn(),
    engineResume: vi.fn(),
    settingsResume: vi.fn(),
    refetchUnansweredQueries: vi.fn(async () => {}),
  }
})

vi.mock("react-native", () => ({
  AppState: {
    addEventListener: (_event: string, listener: (state: AppStateStatus) => void) => {
      mocks.appStateListeners.add(listener)
      return { remove: () => mocks.appStateListeners.delete(listener) }
    },
  },
}))

vi.mock("expo-network", () => ({
  addNetworkStateListener: (listener: (state: { isConnected?: boolean }) => void) => {
    mocks.networkListeners.add(listener)
    return { remove: () => mocks.networkListeners.delete(listener) }
  },
  getNetworkStateAsync: async () => ({ ...mocks.networkState }),
}))

vi.mock("@follow/store/sync/transaction-queue", () => ({
  transactionQueue: {
    resume: mocks.queueResume,
    onFailure: (listener: (event: { records: unknown[]; error: unknown }) => void) => {
      mocks.failureListeners.add(listener)
      return () => mocks.failureListeners.delete(listener)
    },
  },
}))

vi.mock("i18next", () => ({
  t: (key: string) => key,
}))

vi.mock("../lib/error-parser", () => ({
  toastFetchError: mocks.toastFetchError,
}))

vi.mock("@follow/store/sync/sync-engine", () => ({
  syncEngine: { resume: mocks.engineResume },
}))

vi.mock("../lib/query-client", () => ({
  refetchUnansweredQueries: mocks.refetchUnansweredQueries,
}))

vi.mock("../modules/settings/sync-queue", () => ({
  settingSyncQueue: { resume: mocks.settingsResume },
}))

vi.mock("../lib/api-client", () => ({
  onApiRecovered: (listener: () => void) => {
    mocks.apiRecoveredListeners.add(listener)
    return () => mocks.apiRecoveredListeners.delete(listener)
  },
}))

const setNetwork = (isConnected: boolean) => {
  for (const listener of mocks.networkListeners) listener({ isConnected })
}

describe("initSyncTriggers", () => {
  beforeEach(async () => {
    vi.resetModules()
    mocks.appStateListeners.clear()
    mocks.networkListeners.clear()
    mocks.apiRecoveredListeners.clear()
    mocks.failureListeners.clear()
    mocks.toastFetchError.mockClear()
    mocks.networkState.isConnected = true
    mocks.queueResume.mockClear()
    mocks.engineResume.mockClear()
    mocks.settingsResume.mockClear()
    mocks.refetchUnansweredQueries.mockClear()

    const { initSyncTriggers } = await import("./sync")
    initSyncTriggers()
    // The network module is loaded lazily.
    await vi.waitFor(() => expect(mocks.networkListeners.size).toBe(1))
    await new Promise((resolve) => setTimeout(resolve, 0))
  })

  it("resumes when the app comes to the foreground", () => {
    for (const listener of mocks.appStateListeners) listener("background")
    expect(mocks.queueResume).not.toHaveBeenCalled()

    for (const listener of mocks.appStateListeners) listener("active")
    expect(mocks.queueResume).toHaveBeenCalledTimes(1)
    expect(mocks.engineResume).toHaveBeenCalledTimes(1)
    expect(mocks.settingsResume).toHaveBeenCalledTimes(1)
  })

  it("resumes when the API answers again after an outage", () => {
    for (const listener of mocks.apiRecoveredListeners) listener()
    expect(mocks.queueResume).toHaveBeenCalledTimes(1)
    expect(mocks.engineResume).toHaveBeenCalledTimes(1)
    expect(mocks.settingsResume).toHaveBeenCalledTimes(1)
    // What failed to load during the outage loads again
    expect(mocks.refetchUnansweredQueries).toHaveBeenCalledTimes(1)
  })

  it("tells the user when the server rejected a change", () => {
    const error = new Error("Entry not found")
    for (const listener of mocks.failureListeners) listener({ records: [{}, {}], error })

    expect(mocks.toastFetchError).toHaveBeenCalledTimes(1)
    expect(mocks.toastFetchError).toHaveBeenCalledWith(error, {
      title: "common:sync.change_rejected",
    })
  })

  it("resumes once the device is connected again, not on every network change", () => {
    setNetwork(true)
    expect(mocks.queueResume).not.toHaveBeenCalled()

    setNetwork(false)
    setNetwork(true)
    setNetwork(true)
    expect(mocks.queueResume).toHaveBeenCalledTimes(1)
    expect(mocks.engineResume).toHaveBeenCalledTimes(1)
    expect(mocks.settingsResume).toHaveBeenCalledTimes(1)
    expect(mocks.refetchUnansweredQueries).toHaveBeenCalledTimes(1)
  })
})
