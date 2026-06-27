import fsp from "node:fs/promises"
import os from "node:os"

import { shell } from "electron"
import path from "pathe"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

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

    await expect(
      service.saveToObsidian({
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

  describe("openURLScheme", () => {
    const openExternalMock = vi.mocked(shell.openExternal)

    beforeEach(() => {
      openExternalMock.mockReset()
      openExternalMock.mockResolvedValue()
    })

    it("rejects input that cannot be parsed as a URL", async () => {
      const service = new IntegrationService()

      await expect(service.openURLScheme("not-a-url")).rejects.toThrow(
        /Invalid URL scheme/i,
      )
      expect(openExternalMock).not.toHaveBeenCalled()
    })

    // These are the dangerous protocols that previously slipped through the
    // "contains ://" guard and reached shell.openExternal verbatim.
    // shell.openExternal docs explicitly warn that passing untrusted URLs is
    // unsafe — file://, smb://, search-ms:, ms-msdt:, jar:, res:, etc. have
    // been used in real-world RCE / NTLM-credential-theft chains.
    it.each([
      ["file:///etc/passwd"],
      ["FILE:///etc/passwd"],
      ["smb://attacker.example/share"],
      ["jar:http://attacker.example/x.jar!/"],
      ["res://shell32.dll/1"],
      ["ms-msdt:/id PCWDiagnostic"],
      ["search-ms:query=secret"],
      ["javascript:alert(1)"],
      ["data:text/html,<script>alert(1)</script>"],
      ["vbscript:msgbox(1)"],
    ])(
      "blocks dangerous scheme %s and does not invoke shell.openExternal",
      async (dangerousScheme) => {
        const service = new IntegrationService()

        await expect(service.openURLScheme(dangerousScheme)).rejects.toThrow(
          /not allowed|disallowed|not permitted/i,
        )
        expect(openExternalMock).not.toHaveBeenCalled()
      },
    )

    // The integration UI ships these schemes as built-in examples
    // (see url-scheme-handler.ts#getExamples) plus generic web/mail.
    // They must keep working after the fix.
    it.each([
      ["https://example.com"],
      ["http://example.com/path?q=1"],
      ["mailto:user@example.com"],
      ["obsidian://new?vault=MyVault&name=Test"],
      ["bear://x-callback-url/create?title=Test"],
      ["things:///add?title=Test"],
      ["notion://new?title=Test"],
      ["x-devonthink://createText?title=Test"],
      ["drafts://x-callback-url/create?text=Test"],
    ])("permits known integration scheme %s", async (allowedScheme) => {
      const service = new IntegrationService()

      await expect(service.openURLScheme(allowedScheme)).resolves.toEqual({
        success: true,
      })
      expect(openExternalMock).toHaveBeenCalledWith(allowedScheme)
    })
  })
})
