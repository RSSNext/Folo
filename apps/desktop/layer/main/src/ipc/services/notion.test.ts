import { beforeEach, describe, expect, it, vi } from "vitest"

import { NotionService } from "./notion"

const mocks = vi.hoisted(() => ({
  values: new Map<string, unknown>(),
  encrypt: vi.fn(() => Buffer.from("encrypted")),
  available: vi.fn(() => true),
  backend: vi.fn(() => "keychain"),
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
    titleProperty = mocks.title
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
    expect(await service.getStatus()).toEqual({
      configured: true,
      dataSourceId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    })
    await service.disconnect()
    expect(await service.getStatus()).toEqual({ configured: false, dataSourceId: "" })
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
