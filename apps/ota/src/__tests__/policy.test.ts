import { describe, expect, it, vi } from "vitest"

import type { Env } from "../env"
import otaWorker from "../index"
import { KV_KEYS } from "../lib/constants"
import type { BinaryPolicyRecord } from "../lib/kv"
import { evaluateBinaryPolicy, evaluateStorePolicy } from "../lib/policy"
import type { MobileOtaRelease } from "../lib/schema"

function createStoreRelease(
  overrides: Partial<
    Pick<MobileOtaRelease, "releaseVersion" | "releaseKind" | "runtimeVersion" | "policy">
  > = {},
): Pick<MobileOtaRelease, "releaseVersion" | "releaseKind" | "runtimeVersion" | "policy"> {
  return {
    releaseVersion: "0.4.3",
    releaseKind: "store",
    runtimeVersion: "0.4.3",
    policy: {
      storeRequired: true,
      minSupportedBinaryVersion: "0.4.0",
      message: "Please update from the store.",
    },
    ...overrides,
  }
}

describe("evaluateStorePolicy", () => {
  it("returns none when there is no release to evaluate", () => {
    const policy = evaluateStorePolicy(null, {
      installedBinaryVersion: "0.4.1",
    })

    expect(policy).toEqual({
      action: "none",
      targetVersion: null,
      message: null,
    })
  })

  it("returns none for non-store releases", () => {
    const policy = evaluateStorePolicy(
      createStoreRelease({
        releaseKind: "ota",
      }),
      {
        installedBinaryVersion: "0.4.1",
      },
    )

    expect(policy).toEqual({
      action: "none",
      targetVersion: null,
      message: null,
    })
  })

  it("requires a store update when a store release is newer than the installed binary", () => {
    const policy = evaluateStorePolicy(createStoreRelease(), {
      installedBinaryVersion: "0.4.2",
    })

    expect(policy.action).toBe("block")
    expect(policy.targetVersion).toBe("0.4.3")
  })

  it("prompts when a newer store release is available but not required", () => {
    const policy = evaluateStorePolicy(
      createStoreRelease({
        policy: {
          storeRequired: false,
          minSupportedBinaryVersion: "0.4.0",
          message: "An update is available.",
        },
      }),
      {
        installedBinaryVersion: "0.4.2",
      },
    )

    expect(policy).toEqual({
      action: "prompt",
      targetVersion: "0.4.3",
      message: "An update is available.",
    })
  })

  it("blocks when the installed binary is below the minimum supported version", () => {
    const policy = evaluateStorePolicy(
      createStoreRelease({
        policy: {
          storeRequired: false,
          minSupportedBinaryVersion: "0.4.2",
          message: "Please update from the store.",
        },
      }),
      {
        installedBinaryVersion: "0.4.1",
      },
    )

    expect(policy).toEqual({
      action: "block",
      targetVersion: "0.4.3",
      message: "Please update from the store.",
    })
  })

  it("returns none when the installed binary is already up to date", () => {
    const policy = evaluateStorePolicy(createStoreRelease(), {
      installedBinaryVersion: "0.4.3",
    })

    expect(policy).toEqual({
      action: "none",
      targetVersion: null,
      message: null,
    })
  })
})

function createBinaryPolicyRecord(overrides: Partial<BinaryPolicyRecord> = {}): BinaryPolicyRecord {
  return {
    releaseVersion: "1.5.1",
    required: false,
    minSupportedBinaryVersion: "1.5.0",
    message: "A desktop update is available.",
    publishedAt: "2026-04-11T10:00:00Z",
    distribution: null,
    downloadUrl: null,
    storeUrl: null,
    ...overrides,
  }
}

describe("evaluateBinaryPolicy", () => {
  it("returns none when there is no matching desktop policy record", () => {
    expect(
      evaluateBinaryPolicy(
        {
          targeted: null,
          generic: null,
        },
        {
          installedBinaryVersion: "1.5.0",
          distribution: "direct",
        },
      ),
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

  it("prefers a distribution-specific desktop policy record", () => {
    const policy = evaluateBinaryPolicy(
      {
        targeted: createBinaryPolicyRecord({
          required: true,
          distribution: "mas",
          storeUrl: "https://apps.apple.com/app/id123456789",
        }),
        generic: createBinaryPolicyRecord({
          distribution: null,
          downloadUrl: "https://ota.folo.is/Folo-1.5.1.dmg",
        }),
      },
      {
        installedBinaryVersion: "1.5.0",
        distribution: "mas",
      },
    )

    expect(policy).toEqual({
      action: "block",
      targetVersion: "1.5.1",
      message: "A desktop update is available.",
      distribution: "mas",
      downloadUrl: null,
      storeUrl: "https://apps.apple.com/app/id123456789",
      publishedAt: "2026-04-11T10:00:00Z",
    })
  })

  it("falls back to the generic desktop policy record", () => {
    const policy = evaluateBinaryPolicy(
      {
        targeted: null,
        generic: createBinaryPolicyRecord({
          required: false,
          distribution: null,
          downloadUrl: "https://ota.folo.is/Folo-1.5.1.exe",
        }),
      },
      {
        installedBinaryVersion: "1.5.0",
        distribution: "mss",
      },
    )

    expect(policy).toEqual({
      action: "prompt",
      targetVersion: "1.5.1",
      message: "A desktop update is available.",
      distribution: "mss",
      downloadUrl: "https://ota.folo.is/Folo-1.5.1.exe",
      storeUrl: null,
      publishedAt: "2026-04-11T10:00:00Z",
    })
  })

  it("blocks when the installed desktop binary is below the minimum supported version", () => {
    const policy = evaluateBinaryPolicy(
      {
        targeted: createBinaryPolicyRecord({
          distribution: "direct",
          required: false,
          minSupportedBinaryVersion: "1.5.1",
          downloadUrl: "https://ota.folo.is/Folo-1.5.2.exe",
          releaseVersion: "1.5.2",
          publishedAt: "2026-04-11T11:00:00Z",
        }),
        generic: null,
      },
      {
        installedBinaryVersion: "1.5.0",
        distribution: "direct",
      },
    )

    expect(policy).toEqual({
      action: "block",
      targetVersion: "1.5.2",
      message: "A desktop update is available.",
      distribution: "direct",
      downloadUrl: "https://ota.folo.is/Folo-1.5.2.exe",
      storeUrl: null,
      publishedAt: "2026-04-11T11:00:00Z",
    })
  })

  it("returns none when the installed desktop binary is already current", () => {
    const policy = evaluateBinaryPolicy(
      {
        targeted: createBinaryPolicyRecord({
          distribution: "direct",
          downloadUrl: "https://ota.folo.is/Folo-1.5.1.exe",
        }),
        generic: null,
      },
      {
        installedBinaryVersion: "1.5.1",
        distribution: "direct",
      },
    )

    expect(policy).toEqual({
      action: "none",
      targetVersion: null,
      message: null,
      distribution: "direct",
      downloadUrl: null,
      storeUrl: null,
      publishedAt: null,
    })
  })
})

describe("/policy", () => {
  it("rejects legacy query-based desktop policy requests", async () => {
    const response = await fetchWorker(
      "/policy?product=desktop&channel=stable&installedBinaryVersion=1.5.0",
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Invalid product query parameter",
    })
  })

  it("returns distribution-specific desktop policy for mas", async () => {
    const response = await fetchWorker(
      "/policy",
      {
        headers: {
          "x-app-platform": "desktop/macos/mas",
          "x-app-version": "1.5.0",
          "x-app-channel": "stable",
        },
      },
      {
        kvEntries: new Map<string, unknown>([
          [
            KV_KEYS.policy("desktop", "stable"),
            createBinaryPolicyRecord({
              distribution: null,
              required: false,
              downloadUrl: "https://ota.folo.is/Folo-1.5.1.dmg",
            }),
          ],
          [
            KV_KEYS.policy("desktop", "stable", "mas"),
            createBinaryPolicyRecord({
              distribution: "mas",
              required: true,
              storeUrl: "https://apps.apple.com/app/id123456789",
              downloadUrl: null,
            }),
          ],
        ]),
      },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      action: "block",
      targetVersion: "1.5.1",
      message: "A desktop update is available.",
      distribution: "mas",
      downloadUrl: null,
      storeUrl: "https://apps.apple.com/app/id123456789",
      publishedAt: "2026-04-11T10:00:00Z",
    })
  })

  it("falls back to generic desktop policy for mss", async () => {
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
        kvEntries: new Map<string, unknown>([
          [
            KV_KEYS.policy("desktop", "stable"),
            createBinaryPolicyRecord({
              distribution: null,
              required: false,
              downloadUrl: "https://ota.folo.is/Folo-1.5.1.exe",
            }),
          ],
        ]),
      },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      action: "prompt",
      targetVersion: "1.5.1",
      message: "A desktop update is available.",
      distribution: "mss",
      downloadUrl: "https://ota.folo.is/Folo-1.5.1.exe",
      storeUrl: null,
      publishedAt: "2026-04-11T10:00:00Z",
    })
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
  } as unknown as KVNamespace
}

function createExecutionContext(): ExecutionContext {
  return {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
  } as unknown as ExecutionContext
}
