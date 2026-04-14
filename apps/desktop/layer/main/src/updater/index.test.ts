import { describe, expect, it, vi } from "vitest"

vi.mock("@follow/shared/bridge", () => ({
  callWindowExpose: () => ({
    distributionUpdateAvailable: vi.fn(),
    updateDownloaded: vi.fn(),
  }),
}))

vi.mock("@follow/shared/constants", () => ({
  DEV: false,
}))

vi.mock("@pkg", () => ({
  version: "1.5.0",
}))

vi.mock("electron-log", () => ({
  default: {
    scope: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}))

vi.mock("electron-updater", () => ({
  autoUpdater: {
    setFeedURL: vi.fn(),
    on: vi.fn(),
  },
}))

vi.mock("../env", () => ({
  channel: "stable",
  isWindows: false,
}))

vi.mock("./api", () => ({
  fetchDesktopManifest: vi.fn(),
  fetchDesktopPolicy: vi.fn(),
  getDesktopRuntimeVersion: () => "1.5.0",
}))

vi.mock("./configs", () => ({
  appUpdaterConfig: {
    enableRenderHotUpdate: true,
    enableCoreUpdate: true,
    enableAppUpdate: true,
    enableDistributionStoreUpdate: false,
    app: {
      autoCheckUpdate: false,
      autoDownloadUpdate: false,
      checkUpdateInterval: 900000,
    },
  },
}))

vi.mock("./follow-update-provider", () => ({
  FollowUpdateProvider: class {},
}))

vi.mock("./windows-updater", () => ({
  WindowsUpdater: class {},
}))

vi.mock("~/manager/window", () => ({
  WindowManager: {
    getMainWindow: () => null,
    destroyMainWindow: vi.fn(),
  },
}))

vi.mock("~/updater/hot-updater", () => ({
  rendererUpdater: {},
  RendererEligibilityStatus: {
    NoManifest: 0,
    RequiresFullAppUpdate: 1,
    AlreadyCurrent: 2,
    Eligible: 3,
  },
}))

describe("finalizeDirectUpdateResult", () => {
  it("prefers a successful renderer update result", async () => {
    const { finalizeDirectUpdateResult } = await import("./index")

    expect(
      finalizeDirectUpdateResult({
        rendererResult: { hasUpdate: true },
        appResult: { hasUpdate: false },
        policy: {
          action: "none",
          targetVersion: null,
          message: null,
          distribution: "direct",
          downloadUrl: null,
          storeUrl: null,
          publishedAt: null,
        },
      }),
    ).toEqual({ hasUpdate: true })
  })

  it("falls back to a successful app update result", async () => {
    const { finalizeDirectUpdateResult } = await import("./index")

    expect(
      finalizeDirectUpdateResult({
        rendererResult: { hasUpdate: false, error: "renderer failed" },
        appResult: { hasUpdate: true },
        policy: {
          action: "none",
          targetVersion: null,
          message: null,
          distribution: "direct",
          downloadUrl: null,
          storeUrl: null,
          publishedAt: null,
        },
      }),
    ).toEqual({ hasUpdate: true })
  })

  it("preserves errors when both renderer and app attempts fail", async () => {
    const { finalizeDirectUpdateResult } = await import("./index")

    expect(
      finalizeDirectUpdateResult({
        rendererResult: { hasUpdate: false, error: "renderer failed" },
        appResult: { hasUpdate: false, error: "app failed" },
        policy: {
          action: "none",
          targetVersion: null,
          message: null,
          distribution: "direct",
          downloadUrl: null,
          storeUrl: null,
          publishedAt: null,
        },
      }),
    ).toEqual({
      hasUpdate: false,
      error: "app failed",
    })
  })

  it("surfaces direct policy availability when no payload can be applied", async () => {
    const { finalizeDirectUpdateResult } = await import("./index")

    expect(
      finalizeDirectUpdateResult({
        rendererResult: { hasUpdate: false },
        appResult: { hasUpdate: false },
        policy: {
          action: "block",
          targetVersion: "1.5.1",
          message: "Install the latest desktop app.",
          distribution: "direct",
          downloadUrl: "https://ota.folo.is/Folo-1.5.1.exe",
          storeUrl: null,
          publishedAt: "2026-04-11T10:00:00.000Z",
        },
      }),
    ).toEqual({ hasUpdate: true })
  })

  it("drops stale renderer and app errors once a direct policy provides an update path", async () => {
    const { finalizeDirectUpdateResult } = await import("./index")

    expect(
      finalizeDirectUpdateResult({
        rendererResult: { hasUpdate: false, error: "renderer failed" },
        appResult: { hasUpdate: false, error: "app failed" },
        policy: {
          action: "prompt",
          targetVersion: "1.5.1",
          message: "Install the latest desktop app.",
          distribution: "direct",
          downloadUrl: "https://ota.folo.is/Folo-1.5.1.exe",
          storeUrl: null,
          publishedAt: "2026-04-11T10:00:00.000Z",
        },
      }),
    ).toEqual({ hasUpdate: true })
  })
})
