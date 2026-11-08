import { beforeEach, expect, it, vi } from "vitest"

import { NotionService } from "./notion"
const mocks = vi.hoisted(() => ({
  values: new Map<string, unknown>(),
  decrypt: vi.fn(() => "legacy-secret"),
  properties: vi.fn(async () => [
    { id: "t", name: "Name", type: "title" },
    { id: "u", name: "URL", type: "url" },
  ]),
  search: vi.fn(async () => ({
    items: [{ id: "source", title: "Notes", databaseId: "db" }],
    nextCursor: null,
  })),
  title: vi.fn(async () => "Name"),
}))
vi.mock("electron", () => ({
  safeStorage: { decryptString: mocks.decrypt },
  net: { fetch: vi.fn() },
}))
vi.mock("electron-ipc-decorator", () => ({ IpcService: class {}, IpcMethod: () => () => {} }))
vi.mock("~/lib/store", () => ({
  store: {
    get: (key: string) => mocks.values.get(key),
    set: (key: string, value: unknown) => mocks.values.set(key, value),
    delete: (key: string) => mocks.values.delete(key),
  },
}))
vi.mock("~/lib/notion/client", () => ({
  NotionClient: class {
    searchSources = mocks.search
    titleProperty = mocks.title
    properties = mocks.properties
  },
}))
beforeEach(() => {
  mocks.values.clear()
  vi.clearAllMocks()
  mocks.decrypt.mockReturnValue("legacy-secret")
})
const local = { token: "synthetic", dataSourceId: "source", mapping: { url: "u" } }
it("hydrates only memory without secure storage and keeps status free of credentials", async () => {
  const service = new NotionService()
  await service.hydrateLocalConnection(local)
  expect(await service.getStatus()).toEqual({
    configured: true,
    dataSourceId: "source",
    legacy: false,
  })
  expect(mocks.values.size).toBe(0)
  expect(mocks.decrypt).not.toHaveBeenCalled()
  expect((await service.getMapping()).mapping).toEqual(local.mapping)
  await service.disconnect()
  expect((await service.getStatus()).configured).toBe(false)
})
it("keeps old encrypted configuration until explicit local persistence acknowledgement", async () => {
  const saved = { encryptedToken: "cipher", dataSourceId: "old" }
  mocks.values.set("notionConnection", saved)
  const service = new NotionService()
  expect((await service.getStatus()).legacy).toBe(true)
  expect(mocks.decrypt).not.toHaveBeenCalled()
  await service.beginSelection("synthetic")
  const selected = await service.selectSource("source")
  expect(selected).toEqual({ token: "synthetic", dataSourceId: "source" })
  expect(mocks.values.get("notionConnection")).toEqual(saved)
  await service.finalizeLocalConnection()
  expect(mocks.values.size).toBe(0)
})
it("does not discard an unavailable legacy credential", async () => {
  const saved = { encryptedToken: "cipher", dataSourceId: "old" }
  mocks.values.set("notionConnection", saved)
  mocks.decrypt.mockImplementationOnce(() => {
    throw new Error("secret")
  })
  const service = new NotionService()
  await expect(service.getMapping()).rejects.toThrow("NOTION_LEGACY_RECONNECT")
  expect(mocks.values.get("notionConnection")).toEqual(saved)
})
it("preserves a selection across identical hydration and validates mappings", async () => {
  const service = new NotionService()
  await service.hydrateLocalConnection(local)
  await service.beginSelection()
  await service.hydrateLocalConnection({ ...local })
  await service.selectSource("source")
  expect(await service.setMapping({ url: "u" })).toEqual(local)
  await expect(service.setMapping({ url: "t" })).rejects.toThrow()
  expect(mocks.values.size).toBe(0)
})
it("rejects malformed local connection input without logging its content", async () => {
  const service = new NotionService()
  await expect(service.hydrateLocalConnection({ ...local, token: "" })).rejects.toThrow(
    "Invalid local connection",
  )
  await expect(
    service.hydrateLocalConnection({ ...local, mapping: { url: 3 } as never }),
  ).rejects.toThrow("Invalid local connection")
})
it("expires and cancels drafts without overwriting previous storage", async () => {
  vi.useFakeTimers()
  try {
    const service = new NotionService()
    await service.beginSelection("synthetic")
    await vi.advanceTimersByTimeAsync(600001)
    await expect(service.selectSource("source")).rejects.toThrow()
    await service.beginSelection("synthetic")
    await service.cancelSelection()
    await expect(service.selectSource("source")).rejects.toThrow()
    expect(mocks.values.size).toBe(0)
  } finally {
    vi.useRealTimers()
  }
})
it("rejects invalid metadata at the IPC boundary", async () => {
  const service = new NotionService()
  const base = { title: "A", url: "https://example.com", content: "body" }
  await expect(service.saveArticle({ ...base, publishedAt: "invalid" })).rejects.toThrow(
    "Invalid article",
  )
  await expect(service.saveArticle({ ...base, aiSummary: "x".repeat(200001) })).rejects.toThrow(
    "Invalid article",
  )
})

it("clears hydrated runtime and legacy credentials on account disconnect", async () => {
  mocks.values.set("notionConnection", { encryptedToken: "cipher", dataSourceId: "old" })
  const service = new NotionService()
  await service.hydrateLocalConnection(local)
  await service.disconnect()
  await service.hydrateLocalConnection(null)
  expect(await service.getStatus()).toEqual({ configured: false, dataSourceId: "", legacy: false })
  await expect(service.getMapping()).rejects.toThrow("Connect Notion first")
})
it("keeps legacy mapping changes encrypted until explicit reconnection", async () => {
  const saved = { encryptedToken: "cipher", dataSourceId: "old" }
  mocks.values.set("notionConnection", saved)
  const service = new NotionService()
  expect(await service.setMapping({ url: "u" })).toBeNull()
  expect(mocks.values.get("notionConnection")).toEqual({ ...saved, mapping: { url: "u" } })
  expect((await service.getStatus()).legacy).toBe(true)
})
it("does not revive a cancelled pending selection", async () => {
  let finish!: (value: {
    items: { id: string; title: string; databaseId: string }[]
    nextCursor: null
  }) => void
  mocks.search.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const service = new NotionService()
  const pending = service.beginSelection("synthetic")
  await service.disconnect()
  finish({ items: [], nextCursor: null })
  await expect(pending).rejects.toThrow("cancelled")
  expect((await service.getStatus()).configured).toBe(false)
})
