import { FollowAPIError } from "@follow-app/client-sdk"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { apiContext } from "../../context"
import { getSyncModelHandler } from "../../sync/model-registry"
import { registerSyncEngine } from "../../sync/sync-status"
import type { SyncAction } from "../../sync/types"
import type { FollowAPI } from "../../types"
import {
  actionActions,
  actionSyncService,
  isActionRulesConflictError,
  useActionStore,
} from "./store"

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

const V1 = "2026-10-13T08:00:00.000Z"
const V2 = "2026-10-13T09:30:00.123Z"
const V3 = "2026-10-13T10:00:00.000Z"

const conflictError = () =>
  new FollowAPIError("The action rules were changed elsewhere", 409, "12001")

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
    documents.set(
      "model:action",
      JSON.stringify({ rules: [{ ...rule("Stored"), index: 0 }], updatedAt: V1 }),
    )
    await actionActions.hydrate()
    registerSyncEngine(engine(true))

    await actionSyncService.ensureRules()

    expect(getMock).not.toHaveBeenCalled()
    expect(useActionStore.getState().rules).toMatchObject([{ name: "Stored" }])
    expect(actionActions.getLoadedVersion()).toBe(V1)
  })

  it("fetches a stored copy without a version once to learn its version", async () => {
    documents.set("model:action", JSON.stringify({ rules: [{ ...rule("Stored"), index: 0 }] }))
    await actionActions.hydrate()
    registerSyncEngine(engine(true))
    getMock.mockResolvedValue({ code: 0, data: { rules: [rule("Stored")], updatedAt: V1 } })

    await actionSyncService.ensureRules()
    await actionSyncService.ensureRules()

    expect(getMock).toHaveBeenCalledTimes(1)
    expect(actionActions.getLoadedVersion()).toBe(V1)
    expect(JSON.parse(documents.get("model:action")!).updatedAt).toBe(V1)
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
    getMock.mockResolvedValue({ code: 0, data: { rules: [] } })
    putMock.mockResolvedValue({ code: 0 })
    await actionSyncService.ensureRules()
    actionActions.addRule(() => "Mine")

    await actionSyncService.saveRules()

    expect(putMock).toHaveBeenCalledTimes(1)
    expect(useActionStore.getState().isDirty).toBe(false)
    expect(JSON.parse(documents.get("model:action")!).rules).toMatchObject([{ name: "Mine" }])
  })

  it("keeps the rules as loaded next to the user's edits", async () => {
    const handler = getSyncModelHandler("action")!
    getMock.mockResolvedValue({ code: 0, data: { rules: [rule("Loaded")] } })
    putMock.mockResolvedValue({ code: 0 })
    await actionSyncService.ensureRules()
    expect(actionActions.getLoadedRules()).toMatchObject([{ name: "Loaded" }])

    actionActions.patchRule(0, { name: "Edited" })
    await handler.apply({
      id: 2,
      model: "action",
      modelId: null,
      action: "U",
      data: { rules: [rule("Changed elsewhere")] },
      createdAt: "2026-09-17T00:00:00.000Z",
    })
    // The edits still change the rules they started from
    expect(actionActions.getLoadedRules()).toMatchObject([{ name: "Loaded" }])

    await actionSyncService.saveRules()
    expect(actionActions.getLoadedRules()).toMatchObject([{ name: "Edited" }])

    await actionActions.reset()
    expect(actionActions.getLoadedRules()).toEqual([])
  })

  it("saves against the version it loaded and keeps the version the save made", async () => {
    getMock.mockResolvedValue({ code: 0, data: { rules: [rule("Loaded")], updatedAt: V1 } })
    putMock.mockResolvedValue({ code: 0, updatedAt: V2 })
    await actionSyncService.ensureRules()
    actionActions.patchRule(0, { name: "Edited" })

    await actionSyncService.saveRules()

    expect(putMock).toHaveBeenCalledWith({
      rules: [expect.objectContaining({ name: "Edited" })],
      expectedUpdatedAt: V1,
    })
    expect(actionActions.getLoadedVersion()).toBe(V2)
    expect(JSON.parse(documents.get("model:action")!).updatedAt).toBe(V2)

    actionActions.patchRule(0, { name: "Edited again" })
    await actionSyncService.saveRules()
    expect(putMock).toHaveBeenLastCalledWith(expect.objectContaining({ expectedUpdatedAt: V2 }))
  })

  it("expects no stored rules when the server had none", async () => {
    getMock.mockResolvedValue({ code: 0 })
    putMock.mockResolvedValue({ code: 0, updatedAt: V1 })
    await actionSyncService.ensureRules()
    actionActions.addRule(() => "First")

    await actionSyncService.saveRules()

    expect(putMock).toHaveBeenCalledWith({
      rules: [expect.objectContaining({ name: "First" })],
      expectedUpdatedAt: null,
    })
  })

  it("saves unconditionally when the version is unknown", async () => {
    // A server or change log entry from before versions existed
    getMock.mockResolvedValue({ code: 0, data: { rules: [rule("Loaded")] } })
    putMock.mockResolvedValue({ code: 0 })
    await actionSyncService.ensureRules()
    actionActions.patchRule(0, { name: "Edited" })

    await actionSyncService.saveRules()

    expect(putMock.mock.calls[0]![0]).not.toHaveProperty("expectedUpdatedAt")
  })

  it("keeps the user's edits when the rules were changed elsewhere", async () => {
    getMock.mockResolvedValue({ code: 0, data: { rules: [rule("Loaded")], updatedAt: V1 } })
    putMock.mockRejectedValue(conflictError())
    await actionSyncService.ensureRules()
    actionActions.patchRule(0, { name: "Mine" })

    const error = await actionSyncService.saveRules().catch((error_: unknown) => error_)

    expect(isActionRulesConflictError(error)).toBe(true)
    expect(useActionStore.getState().rules).toMatchObject([{ name: "Mine" }])
    expect(useActionStore.getState().isDirty).toBe(true)
    expect(actionActions.getLoadedVersion()).toBe(V1)
    expect(JSON.parse(documents.get("model:action")!).rules).toMatchObject([{ name: "Loaded" }])
  })

  it("loads the latest rules or saves over them after a conflict, as the user chooses", async () => {
    getMock.mockResolvedValueOnce({
      code: 0,
      data: { rules: [rule("Loaded")], updatedAt: V1 },
    })
    putMock.mockRejectedValueOnce(conflictError())
    await actionSyncService.ensureRules()
    actionActions.patchRule(0, { name: "Mine" })
    await actionSyncService.saveRules().catch(() => {})

    // Saving over them sends no version, so the server replaces whatever it has
    putMock.mockResolvedValueOnce({ code: 0, updatedAt: V3 })
    await actionSyncService.saveRules({ overwrite: true })
    expect(putMock).toHaveBeenLastCalledWith({
      rules: [expect.objectContaining({ name: "Mine" })],
    })
    expect(actionActions.getLoadedVersion()).toBe(V3)

    // Loading the latest rules drops the edits
    actionActions.patchRule(0, { name: "Mine again" })
    getMock.mockResolvedValueOnce({
      code: 0,
      data: { rules: [rule("From another device")], updatedAt: V3 },
    })
    await actionSyncService.fetchRules()
    expect(useActionStore.getState().rules).toMatchObject([{ name: "From another device" }])
    expect(useActionStore.getState().isDirty).toBe(false)
    expect(actionActions.getLoadedVersion()).toBe(V3)
  })

  it("follows the change log's version unless the user is editing", async () => {
    const handler = getSyncModelHandler("action")!
    const action = (name: string, updatedAt: string): SyncAction => ({
      id: 3,
      model: "action",
      modelId: null,
      action: "U",
      data: { rules: [rule(name)], updatedAt },
      createdAt: updatedAt,
    })
    putMock.mockResolvedValue({ code: 0, updatedAt: V3 })

    await handler.apply(action("From another device", V1))
    expect(actionActions.getLoadedVersion()).toBe(V1)

    actionActions.patchRule(0, { name: "Mine" })
    await handler.apply(action("Changed elsewhere", V2))
    // The edits change the version they started from, so the save is checked against it
    expect(actionActions.getLoadedVersion()).toBe(V1)
    expect(JSON.parse(documents.get("model:action")!).updatedAt).toBe(V2)

    await actionSyncService.saveRules()
    expect(putMock).toHaveBeenCalledWith(expect.objectContaining({ expectedUpdatedAt: V1 }))
  })

  it("refuses to save when the server's rules were never loaded", async () => {
    getMock.mockRejectedValue(new Error("Internal Server Error"))
    await expect(actionSyncService.ensureRules()).rejects.toThrow()
    actionActions.addRule(() => "Mine")

    await expect(actionSyncService.saveRules()).rejects.toThrow()

    expect(putMock).not.toHaveBeenCalled()
    expect(useActionStore.getState().isDirty).toBe(true)
  })
})
