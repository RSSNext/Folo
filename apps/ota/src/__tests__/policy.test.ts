import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Env } from "../env"
import otaWorker from "../index"
import { KV_KEYS } from "../lib/constants"
import { evaluateBinaryPolicy, evaluateStorePolicy } from "../lib/policy"

describe("evaluateStorePolicy", () => {
  it("returns none when the store version is unavailable", () => {
    expect(
      evaluateStorePolicy(null, {
        installedBinaryVersion: "0.4.1",
      }),
    ).toEqual({
      action: "none",
      targetVersion: null,
      message: null,
    })
  })

  it("prompts when a newer store version is available", () => {
    expect(
      evaluateStorePolicy("0.4.3", {
        installedBinaryVersion: "0.4.1",
      }),
    ).toEqual({
      action: "prompt",
      targetVersion: "0.4.3",
      message: null,
    })
  })

  it("returns none when the installed binary is already current", () => {
    expect(
      evaluateStorePolicy("0.4.1", {
        installedBinaryVersion: "0.4.1",
      }),
    ).toEqual({
      action: "none",
      targetVersion: null,
      message: null,
    })
  })
})

describe("evaluateBinaryPolicy", () => {
  it("returns none for direct builds", () => {
    expect(
      evaluateBinaryPolicy({
        distribution: "direct",
        installedBinaryVersion: "1.5.0",
        latestStoreVersion: "1.5.1",
        storeUrl: null,
      }),
    ).toEqual({
      action: "none",
      targetVersion: null,
      message: null,
      distribution: "direct",
      downloadUrl: null,
      storeUrl: null,
      publishedAt: null,
    })
  })

  it("prompts store builds when the storefront has a newer version", () => {
    expect(
      evaluateBinaryPolicy({
        distribution: "mas",
        installedBinaryVersion: "1.5.0",
        latestStoreVersion: "1.5.1",
        storeUrl: "https://apps.apple.com/us/app/folo-follow-everything/id6739802604?platform=mac",
      }),
    ).toEqual({
      action: "prompt",
      targetVersion: "1.5.1",
      message: null,
      distribution: "mas",
      downloadUrl: null,
      storeUrl: "https://apps.apple.com/us/app/folo-follow-everything/id6739802604?platform=mac",
      publishedAt: null,
    })
  })
})

describe("/policy", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("requires a platform for mobile policy checks", async () => {
    const response = await fetchWorker("/policy?product=mobile&installedBinaryVersion=0.4.1")

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Missing platform query parameter",
    })
  })

  it("returns none for non-production mobile channels without hitting the store", async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal("fetch", fetchSpy)

    const response = await fetchWorker(
      "/policy?product=mobile&platform=ios&channel=preview&installedBinaryVersion=0.4.1",
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      action: "none",
      targetVersion: null,
      message: null,
    })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("detects iOS store versions through the Apple lookup API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        expect(url).toBe("https://itunes.apple.com/lookup?id=6739802604")

        return new Response(
          JSON.stringify({
            resultCount: 1,
            results: [{ version: "0.4.3" }],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        )
      }),
    )

    const response = await fetchWorker(
      "/policy?product=mobile&platform=ios&channel=production&installedBinaryVersion=0.4.1",
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      action: "prompt",
      targetVersion: "0.4.3",
      message: null,
    })
  })

  it("falls back to the iOS App Store page when the Apple lookup API fails", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)

        if (url === "https://itunes.apple.com/lookup?id=6739802604") {
          throw new Error("lookup unavailable")
        }

        if (url === "https://apps.apple.com/us/app/folo-follow-everything/id6739802604") {
          return new Response(
            '<script type="application/json">{"primarySubtitle":"Version 0.4.4"}</script>',
            { status: 200, headers: { "content-type": "text/html" } },
          )
        }

        throw new Error(`Unhandled fetch URL: ${url}`)
      }),
    )

    const response = await fetchWorker(
      "/policy?product=mobile&platform=ios&channel=production&installedBinaryVersion=0.4.1",
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      action: "prompt",
      targetVersion: "0.4.4",
      message: null,
    })
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[ota] Apple lookup request failed for iOS store version, falling back",
      expect.any(Error),
    )
  })

  it("uses the cached iOS store version when KV is populated", async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal("fetch", fetchSpy)

    const response = await fetchWorker(
      "/policy?product=mobile&platform=ios&channel=production&installedBinaryVersion=0.4.1",
      undefined,
      {
        kvEntries: new Map([
          [
            KV_KEYS.storeVersion("mobile", "ios"),
            {
              version: "0.4.3",
              fetchedAt: "2026-04-12T14:00:00.000Z",
              source: "app-store",
            },
          ],
        ]),
      },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      action: "prompt",
      targetVersion: "0.4.3",
      message: null,
    })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("detects Mac App Store versions from the storefront page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        expect(url).toBe(
          "https://apps.apple.com/us/app/folo-follow-everything/id6739802604?platform=mac",
        )

        return new Response(
          '<script type="application/json">{"primarySubtitle":"Version 1.5.1"}</script>',
          { status: 200, headers: { "content-type": "text/html" } },
        )
      }),
    )

    const response = await fetchWorker("/policy", {
      headers: {
        "x-app-platform": "desktop/macos/mas",
        "x-app-version": "1.5.0",
        "x-app-channel": "stable",
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      action: "prompt",
      targetVersion: "1.5.1",
      message: null,
      distribution: "mas",
      downloadUrl: null,
      storeUrl: "https://apps.apple.com/us/app/folo-follow-everything/id6739802604?platform=mac",
      publishedAt: null,
    })
  })

  it("skips external checks for direct desktop builds", async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal("fetch", fetchSpy)

    const response = await fetchWorker("/policy", {
      headers: {
        "x-app-platform": "desktop/windows/exe",
        "x-app-version": "1.5.0",
        "x-app-channel": "stable",
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      action: "none",
      targetVersion: null,
      message: null,
      distribution: "direct",
      downloadUrl: null,
      storeUrl: null,
      publishedAt: null,
    })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("detects Microsoft Store versions through the public update service", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)

        if (
          url ===
          "https://storeedgefd.dsx.mp.microsoft.com/v9.0/products/9nvfzpv0v0ht?market=US&locale=en-US&deviceFamily=Windows.Desktop"
        ) {
          return new Response(
            JSON.stringify({
              Payload: {
                Skus: [
                  {
                    FulfillmentData: JSON.stringify({
                      WuCategoryId: "wu-category-id",
                      PackageFamilyName:
                        "NaturalSelectionLabs.Follow-Yourfavoritesinoneinbo_abc123",
                    }),
                  },
                ],
              },
            }),
            {
              status: 200,
              headers: { "content-type": "application/json" },
            },
          )
        }

        if (url === "https://fe3.delivery.mp.microsoft.com/ClientWebService/client.asmx") {
          const body = String(init?.body ?? "")

          if (body.includes("GetCookie")) {
            return new Response("<EncryptedData>cookie-value</EncryptedData>", {
              status: 200,
              headers: { "content-type": "application/soap+xml" },
            })
          }

          expect(body).toContain("<Id>wu-category-id</Id>")
          expect(body).toContain("FlightRing=Retail;DeviceFamily=Windows.Desktop;")

          return new Response(
            [
              '&lt;PackageMoniker="NaturalSelectionLabs.Follow-Yourfavoritesinoneinbo_1.5.1.0_x64__abc123"&gt;',
              '&lt;PackageMoniker="NaturalSelectionLabs.Follow-Yourfavoritesinoneinbo_1.5.2.0_x64__abc123"&gt;',
            ].join(""),
            {
              status: 200,
              headers: { "content-type": "application/soap+xml" },
            },
          )
        }

        throw new Error(`Unhandled fetch URL: ${url}`)
      }),
    )

    const response = await fetchWorker("/policy", {
      headers: {
        "x-app-platform": "desktop/windows/ms",
        "x-app-version": "1.5.0",
        "x-app-channel": "stable",
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      action: "prompt",
      targetVersion: "1.5.2",
      message: null,
      distribution: "mss",
      downloadUrl: null,
      storeUrl: "https://apps.microsoft.com/detail/9nvfzpv0v0ht?mode=direct",
      publishedAt: null,
    })
  })

  it("uses the cached Microsoft Store version when KV is populated", async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal("fetch", fetchSpy)

    const response = await fetchWorker(
      "/policy",
      {
        headers: {
          "x-app-platform": "desktop/windows/ms",
          "x-app-version": "1.5.0",
          "x-app-channel": "stable",
        },
      },
      {
        kvEntries: new Map([
          [
            KV_KEYS.storeVersion("desktop", "mss"),
            {
              version: "1.5.1",
              fetchedAt: "2026-04-12T14:00:00.000Z",
              source: "microsoft-store",
            },
          ],
        ]),
      },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      action: "prompt",
      targetVersion: "1.5.1",
      message: null,
      distribution: "mss",
      downloadUrl: null,
      storeUrl: "https://apps.microsoft.com/detail/9nvfzpv0v0ht?mode=direct",
      publishedAt: null,
    })
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

async function fetchWorker(
  path: string,
  init?: RequestInit,
  options?: {
    kvEntries?: Map<string, unknown>
  },
) {
  return otaWorker.fetch(
    new Request(`https://ota.folo.is${path}`, init),
    createEnv(options),
    createExecutionContext(),
  )
}

function createEnv(options?: { kvEntries?: Map<string, unknown> }): Env {
  return {
    OTA_KV: createKvNamespace(options?.kvEntries),
    OTA_BUCKET: {} as R2Bucket,
    GITHUB_OWNER: "",
    GITHUB_REPO: "",
    GITHUB_TOKEN: "",
    OTA_SYNC_TOKEN: "",
    OTA_SYNC_TOKEN_HEADER: "x-ota-sync-token",
  }
}

function createKvNamespace(entries = new Map<string, unknown>()): KVNamespace {
  return {
    get: vi.fn(async (key: string) => entries.get(key) ?? null),
    put: vi.fn(async () => {}),
    delete: vi.fn(async () => {}),
  } as unknown as KVNamespace
}

function createExecutionContext(): ExecutionContext {
  return {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
  } as unknown as ExecutionContext
}
