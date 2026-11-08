import { beforeEach, expect, it, vi } from "vitest"

import { NotionService } from "./notion"
const mocks = vi.hoisted(() => ({
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
  net: { fetch: vi.fn() },
}))
vi.mock("electron-ipc-decorator", () => ({ IpcService: class {}, IpcMethod: () => () => {} }))
vi.mock("~/lib/notion/client", () => ({
  NotionClient: class {
    searchSources = mocks.search
    titleProperty = mocks.title
    properties = mocks.properties
  },
}))
beforeEach(() => {
  vi.clearAllMocks()
})
const local = { token: "synthetic", dataSourceId: "source", mapping: { url: "u" } }
it("hydrates only memory without secure storage and keeps status free of credentials", async () => {
  const service = new NotionService()
  await service.hydrateLocalConnection(local)
  expect(await service.getStatus()).toEqual({
    configured: true,
    dataSourceId: "source",
  })
  expect((await service.getMapping()).mapping).toEqual(local.mapping)
  await service.disconnect()
  expect((await service.getStatus()).configured).toBe(false)
})
it("preserves a selection across identical hydration and validates mappings", async () => {
  const service = new NotionService()
  await service.hydrateLocalConnection(local)
  await service.beginSelection()
  await service.hydrateLocalConnection({ ...local })
  await service.selectSource("source")
  expect(await service.setMapping({ url: "u" })).toEqual(local)
  await expect(service.setMapping({ url: "t" })).rejects.toThrow()
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

it("clears hydrated runtime on account disconnect", async () => {
  const service = new NotionService()
  await service.hydrateLocalConnection(local)
  await service.disconnect()
  await service.hydrateLocalConnection(null)
  expect(await service.getStatus()).toEqual({ configured: false, dataSourceId: "" })
  await expect(service.getMapping()).rejects.toThrow("Connect Notion first")
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

it("requires renderer hydration after the main service restarts", async () => {
  const previous = new NotionService()
  await previous.hydrateLocalConnection(local)
  const restarted = new NotionService()
  expect(await restarted.getStatus()).toEqual({ configured: false, dataSourceId: "" })
  await expect(restarted.getMapping()).rejects.toThrow("Connect Notion first")
  await restarted.hydrateLocalConnection(local)
  expect((await restarted.getMapping()).mapping).toEqual(local.mapping)
})
