import { describe, expect, it, vi } from "vitest"

import { isRendererManifestUsable } from "./hot-updater"

vi.mock("electron", () => ({
  app: {
    getPath: vi.fn(() => "/tmp"),
  },
}))

vi.mock("@follow/shared/bridge", () => ({
  callWindowExpose: vi.fn(() => ({
    readyToUpdate: vi.fn(),
  })),
}))

vi.mock("@pkg", () => ({
  version: "1.6.0",
  runtimeVersion: "1.6.0",
}))

vi.mock("electron-log", () => ({
  default: {
    scope: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  },
}))

vi.mock("~/manager/window", () => ({
  WindowManager: {
    getMainWindow: vi.fn(() => null),
  },
}))

vi.mock("./configs", () => ({
  appUpdaterConfig: {
    enableRenderHotUpdate: true,
  },
}))

describe("renderer hot updater manifest compatibility", () => {
  it("rejects legacy cached manifests without a runtimeVersion", () => {
    expect(
      isRendererManifestUsable(
        {
          version: "0.6.3-12-gbfdc371ff",
        },
        {
          appVersion: "1.6.0",
          runtimeVersion: "1.6.0",
        },
      ),
    ).toBe(false)
  })

  it("rejects cached renderer manifests older than the current app version", () => {
    expect(
      isRendererManifestUsable(
        {
          runtimeVersion: "1.6.0",
          version: "0.6.4",
        },
        {
          appVersion: "1.6.0",
          runtimeVersion: "1.6.0",
        },
      ),
    ).toBe(false)
  })

  it("accepts cached renderer manifests that match the current runtime and app version", () => {
    expect(
      isRendererManifestUsable(
        {
          runtimeVersion: "1.6.0",
          version: "1.6.0",
        },
        {
          appVersion: "1.6.0",
          runtimeVersion: "1.6.0",
        },
      ),
    ).toBe(true)
  })
})
