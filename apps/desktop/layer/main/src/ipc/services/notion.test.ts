import { beforeEach, describe, expect, it, vi } from "vitest"

import { NotionService } from "./notion"

const mocks = vi.hoisted(() => ({
  values: new Map<string, unknown>(),
  encrypt: vi.fn(() => Buffer.from("encrypted")),
  available: vi.fn(() => true),
  backend: vi.fn(() => "keychain"),
  properties: vi.fn(async () => [
    { id: "t", name: "Name", type: "title" },
    { id: "u", name: "Link", type: "url" },
  ]),
  search: vi.fn(async () => ({
    items: [{ id: "source", title: "Notes", databaseId: "db" }],
    nextCursor: null,
  })),
  title: vi.fn(async () => "Name"),
}))
vi.mock("electron", () => ({
  safeStorage: {
    isEncryptionAvailable: mocks.available,
    getSelectedStorageBackend: mocks.backend,
    encryptString: mocks.encrypt,
    decryptString: () => "secret",
  },
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

describe("NotionService credentials", () => {
  beforeEach(() => {
    mocks.values.clear()
    vi.clearAllMocks()
    mocks.available.mockReturnValue(true)
    mocks.backend.mockReturnValue("keychain")
  })
  it("stores encrypted credentials only after validating the data source", async () => {
    const service = new NotionService()
    await service.configure({
      token: "secret",
      dataSourceId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    })
    expect(mocks.title).toHaveBeenCalled()
    expect(mocks.encrypt).toHaveBeenCalledWith("secret")
    expect(JSON.stringify([...mocks.values.values()])).not.toContain("secret")
    expect(await service.getStatus()).toMatchObject({
      configured: true,
      dataSourceId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    })
    await service.disconnect()
    expect(await service.getStatus()).toMatchObject({ configured: false, dataSourceId: "" })
  })
  it("refuses plaintext fallback when the OS key store is unavailable", async () => {
    mocks.available.mockReturnValue(false)
    await expect(
      new NotionService().configure({
        token: "secret",
        dataSourceId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      }),
    ).rejects.toThrow("secure storage")
    expect(mocks.values.size).toBe(0)
  })
})

it("does not restore a connection after disconnect during validation", async () => {
  mocks.available.mockReturnValue(true)
  mocks.values.clear()
  let resolve: (value: string) => void = () => {}
  mocks.title.mockImplementationOnce(
    () =>
      new Promise<string>((done) => {
        resolve = done
      }),
  )
  const service = new NotionService()
  const configuring = service.configure({
    token: "secret",
    dataSourceId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  })
  await service.disconnect()
  resolve("Name")
  await expect(configuring).rejects.toThrow("cancelled")
  expect((await service.getStatus()).configured).toBe(false)
})

it("stores validated mappings without returning credentials and clears on disconnect", async () => {
  const service = new NotionService()
  await service.configure({ token: "secret", dataSourceId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" })
  await service.setMapping({ url: "u" })
  expect(await service.getMapping()).toMatchObject({ mapping: { url: "u" } })
  expect(JSON.stringify(await service.getMapping())).not.toContain("secret")
  await expect(service.setMapping({ url: "t" })).rejects.toThrow()
  await service.disconnect()
  await expect(service.getMapping()).rejects.toThrow()
})

it("refuses picker use when secure storage is unavailable", async () => {
  mocks.values.clear()
  mocks.available.mockReturnValue(false)
  const calls = mocks.search.mock.calls.length
  await expect(new NotionService().beginSelection("synthetic")).rejects.toThrow(
    "NOTION_STORAGE_UNAVAILABLE",
  )
  expect(mocks.search.mock.calls.length).toBe(calls)
  expect(mocks.values.size).toBe(0)
  mocks.available.mockReturnValue(true)
})
it("expires a draft without overwriting the saved connection", async () => {
  vi.useFakeTimers()
  try {
    const service = new NotionService()
    await service.beginSelection("synthetic")
    await vi.advanceTimersByTimeAsync(600001)
    await expect(service.selectSource("source")).rejects.toThrow()
  } finally {
    vi.useRealTimers()
  }
})

it("does not revive a cancelled pending selection", async () => {
  let finish!: (value: {
    items: Array<{ id: string; title: string; databaseId: string }>
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
  await service.cancelSelection()
  finish({ items: [], nextCursor: null })
  await expect(pending).rejects.toThrow("cancelled")
  await expect(service.selectSource("source")).rejects.toThrow()
})

it("rejects invalid new metadata at the IPC boundary", async () => {
  mocks.available.mockReturnValue(true)
  const service = new NotionService()
  const base = { title: "A", url: "https://example.com", content: "body" }
  await expect(service.saveArticle({ ...base, publishedAt: "invalid" })).rejects.toThrow(
    "Invalid article",
  )
  await expect(service.saveArticle({ ...base, aiSummary: "a".repeat(200001) })).rejects.toThrow(
    "Invalid article",
  )
  await expect(service.saveArticle({ ...base, categories: ["x".repeat(2001)] })).rejects.toThrow(
    "Invalid article",
  )
})

it("persists only validated encrypted picker credentials and preserves the old connection on cancel", async () => {
  mocks.available.mockReturnValue(true)
  const previous = { encryptedToken: "old-cipher", dataSourceId: "old" }
  mocks.values.set("notionConnection", previous)
  const service = new NotionService()
  await service.beginSelection("synthetic-picker-token")
  expect(mocks.values.get("notionConnection")).toEqual(previous)
  await service.cancelSelection()
  expect(mocks.values.get("notionConnection")).toEqual(previous)
  await service.beginSelection("synthetic-picker-token")
  await service.selectSource("source")
  expect(mocks.values.get("notionConnection")).toEqual({
    encryptedToken: Buffer.from("encrypted").toString("base64"),
    dataSourceId: "source",
  })
  expect(JSON.stringify(await service.getStatus())).not.toContain("token")
  expect(JSON.stringify([...mocks.values.values()])).not.toContain("synthetic-picker-token")
  await service.disconnect()
  expect(mocks.values.has("notionConnection")).toBe(false)
})
