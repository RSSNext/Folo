import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { apiContext } from "../../context"
import { getSyncModelHandler } from "../../sync/model-registry"
import { registerSyncEngine } from "../../sync/sync-status"
import type { SyncAction } from "../../sync/types"
import type { FollowAPI } from "../../types"
import { actionActions, actionSyncService, useActionStore } from "./store"

const { documents } = vi.hoisted(() => ({ documents: new Map<string, string>() }))

vi.mock("@follow/database/services/sync-meta", () => ({
  SyncMetaService: {
    get: vi.fn(async (key: string) => documents.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => {
      documents.set(key, value)
    }),
    delete: vi.fn(async (key: string) => {
      documents.delete(key)
    }),
    reset: vi.fn(async () => documents.clear()),
  },
}))

const rule = (name: string, result: Record<string, unknown> = {}) => ({
  name,
  condition: [],
  result,
})

const engine = (synced: boolean) => ({
  ensureSynced: vi.fn(async () => synced),
  catchUp: vi.fn(async () => synced),
  requestUnreadCalibration: vi.fn(async () => {}),
  recordUnreadSnapshot: vi.fn(async () => {}),
})

describe("action rules and the sync engine", () => {
  const getMock = vi.fn()
  const putMock = vi.fn()

  beforeEach(async () => {
    vi.clearAllMocks()
    documents.clear()
    await actionActions.reset()
    apiContext.provide({ actions: { get: getMock, put: putMock } } as unknown as FollowAPI)
  })

  afterEach(() => {
    registerSyncEngine(null)
  })

  it("requests the rules without a sync engine and stores what the server answered", async () => {
    getMock.mockResolvedValue({
      code: 0,
      data: { rules: [rule("Notify", { newEntryNotification: true })] },
    })

    await actionSyncService.ensureRules()

    expect(getMock).toHaveBeenCalledTimes(1)
    expect(useActionStore.getState().rules).toMatchObject([{ name: "Notify", index: 0 }])
    expect(useActionStore.getState().isDirty).toBe(false)
    expect(JSON.parse(documents.get("model:action")!).rules).toHaveLength(1)
  })

  it("uses the hydrated rules when the sync engine keeps them current", async () => {
    documents.set("model:action", JSON.stringify({ rules: [{ ...rule("Stored"), index: 0 }] }))
    await actionActions.hydrate()
    registerSyncEngine(engine(true))

    await actionSyncService.ensureRules()

    expect(getMock).not.toHaveBeenCalled()
    expect(useActionStore.getState().rules).toMatchObject([{ name: "Stored" }])
  })

  it("still requests the rules when the engine runs but nothing was stored yet", async () => {
    registerSyncEngine(engine(true))
    getMock.mockResolvedValue({ code: 0, data: { rules: [] } })

    await actionSyncService.ensureRules()

    expect(getMock).toHaveBeenCalledTimes(1)
    expect(actionActions.isLoaded()).toBe(true)
  })

  it("applies rules from the change log but never replaces unsaved edits", async () => {
    const handler = getSyncModelHandler("action")!
    const action = (rules: unknown[]): SyncAction => ({
      id: 1,
      model: "action",
      modelId: null,
      action: "U",
      data: { rules },
      createdAt: "2026-09-17T00:00:00.000Z",
    })

    await handler.apply(action([rule("From another device")]))
    expect(useActionStore.getState().rules).toMatchObject([
      { name: "From another device", index: 0 },
    ])
    expect(useActionStore.getState().isDirty).toBe(false)

    actionActions.addRule(() => "Being edited")
    await handler.apply(action([rule("Changed elsewhere")]))

    expect(useActionStore.getState().rules.map((item) => item.name)).toEqual([
      "From another device",
      "Being edited",
    ])
    expect(useActionStore.getState().isDirty).toBe(true)
    // The confirmed version is remembered, so the next launch starts from it.
    expect(JSON.parse(documents.get("model:action")!).rules).toMatchObject([
      { name: "Changed elsewhere" },
    ])
  })

  it("remembers saved rules as the confirmed version", async () => {
    putMock.mockResolvedValue({ code: 0 })
    actionActions.addRule(() => "Mine")

    await actionSyncService.saveRules()

    expect(putMock).toHaveBeenCalledTimes(1)
    expect(useActionStore.getState().isDirty).toBe(false)
    expect(JSON.parse(documents.get("model:action")!).rules).toMatchObject([{ name: "Mine" }])
  })
})
