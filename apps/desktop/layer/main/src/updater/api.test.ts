import { beforeEach, describe, expect, it, vi } from "vitest"

const { getCurrentRendererManifestMock } = vi.hoisted(() => ({
  getCurrentRendererManifestMock: vi.fn<() => null | { runtimeVersion: string; version: string }>(
    () => null,
  ),
}))

vi.mock("@follow/shared/env.desktop", () => ({
  env: {
    VITE_OTA_URL: "https://ota.folo.is",
  },
}))

vi.mock("@follow/utils/headers", () => ({
  createDesktopAPIHeaders: () => ({
    "X-App-Platform": "desktop/windows/exe",
    "X-App-Version": "1.5.0",
  }),
}))

vi.mock("@pkg", () => ({
  default: {
    version: "1.5.0",
    runtimeVersion: "1.5.0",
  },
  version: "1.5.0",
  runtimeVersion: "1.5.0",
}))

vi.mock("../env", () => ({
  channel: "stable",
}))

vi.mock("~/updater/hot-updater", () => ({
  getCurrentRendererManifest: getCurrentRendererManifestMock,
  isRendererManifestUsable: (
    manifest: { runtimeVersion?: string; version?: string } | null,
    input: { appVersion: string; runtimeVersion: string },
  ) => {
    if (!manifest?.runtimeVersion || manifest.runtimeVersion !== input.runtimeVersion) {
      return false
    }

    const manifestVersion = manifest.version?.split("-")[0]
    const appVersion = input.appVersion?.split("-")[0]

    if (!manifestVersion || !appVersion) {
      return false
    }

    return manifestVersion >= appVersion
  },
}))

describe("desktop updater api", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
    getCurrentRendererManifestMock.mockReturnValue(null)
  })

  it("returns null when desktop manifest responds 204", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }))

    const { fetchDesktopManifest } = await import("./api")
    const result = await fetchDesktopManifest()

    expect(result).toBeNull()
    expect(fetch).toHaveBeenCalledWith(
      new URL("/manifest", "https://ota.folo.is"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-App-Platform": "desktop/windows/exe",
          "X-App-Version": "1.5.0",
          "X-App-Channel": "stable",
          "X-App-Runtime-Version": "1.5.0",
          "X-App-Renderer-Version": "1.5.0",
        }),
      }),
    )
  })

  it("parses desktop manifest responses", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "manifest-id",
          createdAt: "2026-04-11T10:00:00.000Z",
          product: "desktop",
          channel: "stable",
          runtimeVersion: "1.5.0",
          renderer: {
            releaseVersion: "1.5.1",
            version: "1.5.1",
            commit: "abcdef1234567890",
            launchAsset: {
              key: "custom-renderer",
              hash: "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqo",
              contentType: "application/gzip",
              url: "https://ota.folo.is/assets/desktop/stable/1.5.0/1.5.1/windows/renderer/custom-renderer.tar.gz",
            },
            assets: [],
          },
          app: null,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    )

    const { fetchDesktopManifest } = await import("./api")
    const result = await fetchDesktopManifest()

    expect(result?.renderer?.version).toBe("1.5.1")
    expect(result?.app).toBeNull()
  })

  it("falls back to the app version when the cached renderer manifest is stale", async () => {
    getCurrentRendererManifestMock.mockReturnValue({
      runtimeVersion: "1.6.0",
      version: "0.6.4",
    })

    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }))

    const { fetchDesktopManifest } = await import("./api")
    await fetchDesktopManifest()

    expect(fetch).toHaveBeenCalledWith(
      new URL("/manifest", "https://ota.folo.is"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-App-Renderer-Version": "1.5.0",
        }),
      }),
    )
  })

  it("parses desktop policy responses", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          action: "block",
          targetVersion: "1.5.1",
          message: "Install the latest desktop app.",
          distribution: "mas",
          downloadUrl: null,
          storeUrl: "https://apps.apple.com/app/id123456789",
          publishedAt: "2026-04-11T10:00:00.000Z",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    )

    const { fetchDesktopPolicy } = await import("./api")
    const result = await fetchDesktopPolicy()

    expect(result).toEqual({
      action: "block",
      targetVersion: "1.5.1",
      message: "Install the latest desktop app.",
      distribution: "mas",
      downloadUrl: null,
      storeUrl: "https://apps.apple.com/app/id123456789",
      publishedAt: "2026-04-11T10:00:00.000Z",
    })
  })

  it("converts desktop manifest hash values back to hex", async () => {
    const { manifestHashToHex } = await import("./api")

    expect(manifestHashToHex("qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqo")).toBe(
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    )
  })
})
