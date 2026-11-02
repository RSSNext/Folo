import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  apiRecoveredListeners: new Set<() => void>(),
  failureListeners: new Set<(event: { records: unknown[]; error: unknown }) => void>(),
  queueResume: vi.fn(),
  engineResume: vi.fn(),
  settingsResume: vi.fn(),
  toastFetchError: vi.fn(),
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

vi.mock("@follow/store/sync/sync-engine", () => ({
  syncEngine: { resume: mocks.engineResume },
}))

vi.mock("~/modules/settings/helper/sync-queue", () => ({
  settingSyncQueue: { resume: mocks.settingsResume },
}))

vi.mock("~/lib/api-client", () => ({
  onApiRecovered: (listener: () => void) => {
    mocks.apiRecoveredListeners.add(listener)
    return () => mocks.apiRecoveredListeners.delete(listener)
  },
}))

vi.mock("~/lib/error-parser", () => ({
  toastFetchError: mocks.toastFetchError,
}))

vi.mock("i18next", () => ({
  t: (key: string) => key,
}))

describe("initSyncTriggers", () => {
  beforeEach(async () => {
    vi.resetModules()
    mocks.apiRecoveredListeners.clear()
    mocks.failureListeners.clear()
    vi.clearAllMocks()
    const { initSyncTriggers } = await import("./sync")
    initSyncTriggers()
  })

  it("sends what waits as soon as the API answers again", () => {
    for (const listener of mocks.apiRecoveredListeners) listener()

    expect(mocks.queueResume).toHaveBeenCalledTimes(1)
    expect(mocks.engineResume).toHaveBeenCalledTimes(1)
    expect(mocks.settingsResume).toHaveBeenCalledTimes(1)
  })

  it("tells the user once when the server rejected a batch of changes", () => {
    const error = new Error("Entry not found")
    for (const listener of mocks.failureListeners) listener({ records: [{}, {}], error })

    expect(mocks.toastFetchError).toHaveBeenCalledTimes(1)
    expect(mocks.toastFetchError).toHaveBeenCalledWith(error, {
      title: "common:sync.change_rejected",
    })
  })
})
