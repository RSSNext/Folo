import { clearStorage } from "@follow/utils/ns"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createNotionLocalClient, notionLocalStorageKey } from "./notion-local"

const connection = { token: "synthetic-secret", dataSourceId: "synthetic-source", mapping: {} }
const makeService = () => ({
  hydrateLocalConnection: vi.fn(async () => {}),
  getStatus: vi.fn(async () => ({
    configured: true,
    dataSourceId: "synthetic-source",
    legacy: false,
  })),
  beginSelection: vi.fn(async () => ({ items: [], nextCursor: null })),
  searchSources: vi.fn(async () => ({ items: [], nextCursor: null })),
  selectSource: vi.fn(async () => connection),
  getMapping: vi.fn(async () => ({ properties: [], mapping: {} })),
  setMapping: vi.fn<() => Promise<typeof connection | null>>(async () => connection),
  finalizeLocalConnection: vi.fn(async () => {}),
  disconnect: vi.fn(async () => {}),
  cancelSelection: vi.fn(async () => {}),
  saveArticle: vi.fn(async () => ({ url: "https://notion.so/page", warnings: [] })),
})

describe("device-local Notion credentials", () => {
  beforeEach(() => localStorage.clear())
  it("persists selected credentials only in the dedicated local namespace and restores after reload", async () => {
    localStorage.setItem("follow:integration", JSON.stringify({ existing: true }))
    const service = makeService()
    const client = createNotionLocalClient(
      () => service,
      () => localStorage,
    )
    expect(await client.selectSource("synthetic-source")).toBeUndefined()
    expect(JSON.parse(localStorage.getItem(notionLocalStorageKey)!)).toEqual(connection)
    expect(localStorage.getItem("follow:integration")).toBe('{"existing":true}')
    const reloaded = makeService()
    const status = await createNotionLocalClient(
      () => reloaded,
      () => localStorage,
    ).getStatus()
    expect(reloaded.hydrateLocalConnection).toHaveBeenCalledWith(connection)
    expect(JSON.stringify(status)).not.toContain("synthetic-secret")
    expect(service.finalizeLocalConnection).toHaveBeenCalledOnce()
  })
  it("does not persist drafts or cancelled selections", async () => {
    const service = makeService()
    const client = createNotionLocalClient(
      () => service,
      () => localStorage,
    )
    await client.beginSelection("synthetic-secret")
    await client.cancelSelection()
    expect(localStorage.getItem(notionLocalStorageKey)).toBeNull()
    expect(service.finalizeLocalConnection).not.toHaveBeenCalled()
  })
  it("clears only Notion credentials on disconnect", async () => {
    localStorage.setItem(notionLocalStorageKey, JSON.stringify(connection))
    localStorage.setItem("follow:integration", "untouched")
    const service = makeService()
    await createNotionLocalClient(
      () => service,
      () => localStorage,
    ).disconnect()
    expect(localStorage.getItem(notionLocalStorageKey)).toBeNull()
    expect(localStorage.getItem("follow:integration")).toBe("untouched")
    expect(service.disconnect).toHaveBeenCalledOnce()
  })
  it("rolls back runtime and retains legacy credentials when local persistence fails", async () => {
    const service = makeService()
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota")
      },
      removeItem: vi.fn(),
    }
    await expect(
      createNotionLocalClient(
        () => service,
        () => storage,
      ).selectSource("synthetic-source"),
    ).rejects.toThrow("NOTION_LOCAL_STORAGE_UNAVAILABLE")
    expect(service.hydrateLocalConnection).toHaveBeenLastCalledWith(null)
    expect(service.finalizeLocalConnection).not.toHaveBeenCalled()
  })
  it("does not discard malformed local storage or expose its contents", async () => {
    localStorage.setItem(notionLocalStorageKey, "invalid synthetic-secret")
    const service = makeService()
    await expect(
      createNotionLocalClient(
        () => service,
        () => localStorage,
      ).getStatus(),
    ).rejects.toThrow("NOTION_LOCAL_STORAGE_INVALID")
    expect(service.hydrateLocalConnection).not.toHaveBeenCalled()
    expect(localStorage.getItem(notionLocalStorageKey)).toBe("invalid synthetic-secret")
  })
  it("forced account cleanup never restores a token when IPC fails", async () => {
    localStorage.setItem(notionLocalStorageKey, JSON.stringify(connection))
    const service = makeService()
    service.disconnect.mockRejectedValue(new Error("transport failed"))
    const client = createNotionLocalClient(
      () => service,
      () => localStorage,
    )
    await expect(client.clearForAccountChange()).rejects.toThrow("Notion credential cleanup failed")
    expect(localStorage.getItem(notionLocalStorageKey)).toBeNull()
  })
  it("still clears main credentials if account cleanup cannot access storage", async () => {
    const service = makeService()
    const storage = {
      getItem: () => null,
      setItem: vi.fn(),
      removeItem: () => {
        throw new Error("denied")
      },
    }
    await expect(
      createNotionLocalClient(
        () => service,
        () => storage,
      ).clearForAccountChange(),
    ).rejects.toThrow("cleanup failed")
    expect(service.disconnect).toHaveBeenCalledOnce()
  })
  it("can explicitly disconnect malformed data without parsing or silently deleting it first", async () => {
    localStorage.setItem(notionLocalStorageKey, "broken")
    const service = makeService()
    await createNotionLocalClient(
      () => service,
      () => localStorage,
    ).disconnect()
    expect(localStorage.getItem(notionLocalStorageKey)).toBeNull()
    expect(service.disconnect).toHaveBeenCalledOnce()
  })
  it("clears immediately and prevents a pending selection from restoring credentials after logout", async () => {
    const service = makeService()
    let resolve!: (value: typeof connection) => void
    service.selectSource.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    const client = createNotionLocalClient(
      () => service,
      () => localStorage,
    )
    const selecting = client.selectSource("source")
    await vi.waitFor(() => expect(service.selectSource).toHaveBeenCalled())
    const queued = client.beginSelection("synthetic")
    const cancelled = expect(queued).rejects.toThrow("cancelled")
    await client.clearForAccountChange()
    expect(service.disconnect).toHaveBeenCalledOnce()
    resolve(connection)
    await expect(selecting).rejects.toThrow("cancelled")
    await cancelled
    expect(localStorage.getItem(notionLocalStorageKey)).toBeNull()
    expect(service.beginSelection).not.toHaveBeenCalled()
  })
  it("does not migrate legacy credentials while saving only a mapping", async () => {
    const service = makeService()
    service.setMapping.mockResolvedValue(null)
    await createNotionLocalClient(
      () => service,
      () => localStorage,
    ).setMapping({})
    expect(localStorage.getItem(notionLocalStorageKey)).toBeNull()
    expect(service.finalizeLocalConnection).not.toHaveBeenCalled()
  })
  it("includes the dedicated key in official clear-all namespace cleanup", () => {
    localStorage.setItem(notionLocalStorageKey, JSON.stringify(connection))
    localStorage.setItem("unrelated", "preserved")
    clearStorage()
    expect(localStorage.getItem(notionLocalStorageKey)).toBeNull()
    expect(localStorage.getItem("unrelated")).toBe("preserved")
  })
})
