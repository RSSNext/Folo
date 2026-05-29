import fsp from "node:fs/promises"
import os from "node:os"

import type { IpcContext } from "electron-ipc-decorator"
import path from "pathe"
import { afterEach, describe, expect, it, vi } from "vitest"

import { IntegrationService } from "./integration"

vi.mock("electron", () => ({
  ipcMain: {
    handle: vi.fn(),
  },
  shell: {
    openExternal: vi.fn(),
  },
}))

vi.mock("electron-ipc-decorator", () => ({
  IpcMethod: () => (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) =>
    descriptor,
  IpcService: class {},
}))

vi.mock("~/lib/store", () => ({
  store: {
    get: vi.fn(),
    set: vi.fn(),
  },
}))

vi.mock("~/logger", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

describe("IntegrationService", () => {
  let vaultPath: string | undefined

  afterEach(async () => {
    if (!vaultPath) return

    await fsp.rm(vaultPath, { force: true, recursive: true })
    vaultPath = undefined
  })

  it("saves Obsidian titles with path separators as one markdown file", async () => {
    vaultPath = await fsp.mkdtemp(path.join(os.tmpdir(), "folo-obsidian-"))
    const service = new IntegrationService()
    const context = {} as IpcContext

    await expect(
      service.saveToObsidian(context, {
        url: "https://example.com",
        title: "KAWA DESIGN 少女前线2：追放 索米·雪兔献礼 1/6比例手办",
        content: "content",
        author: "Folo",
        publishedAt: "2026-05-14T04:20:44.405Z",
        vaultPath,
      }),
    ).resolves.toEqual({ success: true })

    await expect(fsp.readdir(vaultPath)).resolves.toEqual([
      "KAWA DESIGN 少女前线2：追放 索米·雪兔献礼 1_6比例手办.md",
    ])
    await expect(
      fsp.stat(path.join(vaultPath, "KAWA DESIGN 少女前线2：追放 索米·雪兔献礼 1")),
    ).rejects.toThrow()
  })
})
