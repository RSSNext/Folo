import { readFileSync } from "node:fs"

import { afterEach, describe, expect, it, vi } from "vitest"

import createExpoConfig, { isDevelopmentRuntime, resolveRuntimeVersion } from "../app.config.base"
import PKG from "../package.json"

interface EasBuildProfile {
  extends?: string
  developmentClient?: boolean
  env?: Record<string, string>
}

const easJson = JSON.parse(readFileSync(new URL("../eas.json", import.meta.url), "utf8")) as {
  build: Record<string, EasBuildProfile>
}

const resolveEasBuildProfile = (name: string): EasBuildProfile => {
  const profile = easJson.build[name]
  if (!profile) {
    throw new Error(`Unknown EAS build profile ${name}`)
  }

  const base = profile.extends ? resolveEasBuildProfile(profile.extends) : {}
  return { ...base, ...profile, env: { ...base.env, ...profile.env } }
}

describe("isDevelopmentRuntime", () => {
  it("follows the EAS build profile even when expo prebuild sets NODE_ENV", () => {
    expect(isDevelopmentRuntime({ profile: "preview", nodeEnv: "development" })).toBe(false)
    expect(isDevelopmentRuntime({ profile: "production", nodeEnv: "development" })).toBe(false)
    expect(isDevelopmentRuntime({ profile: "development", nodeEnv: "production" })).toBe(true)
    expect(isDevelopmentRuntime({ profile: "ios-simulator", nodeEnv: undefined })).toBe(true)
  })

  it("falls back to NODE_ENV without a build profile", () => {
    expect(isDevelopmentRuntime({ profile: undefined, nodeEnv: "development" })).toBe(true)
    expect(isDevelopmentRuntime({ profile: undefined, nodeEnv: "production" })).toBe(false)
  })
})

describe("runtime version per EAS build profile", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  // EAS generates `android/` with `expo prebuild`, which sets NODE_ENV=development.
  it.each(Object.keys(easJson.build))("%s embeds the expected runtime version", (name) => {
    const profile = resolveEasBuildProfile(name)
    expect(profile.env?.PROFILE).toBeTruthy()

    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("OTA_RUNTIME_VERSION", undefined)
    for (const [key, value] of Object.entries(profile.env ?? {})) {
      vi.stubEnv(key, value)
    }

    const config = createExpoConfig({ config: {} } as Parameters<typeof createExpoConfig>[0])
    expect(config.runtimeVersion).toBe(profile.developmentClient ? "0.0.0-dev" : PKG.version)
  })

  it("keeps OTA_RUNTIME_VERSION for OTA exports", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("PROFILE", undefined)
    vi.stubEnv("OTA_RUNTIME_VERSION", "0.5.11")

    const config = createExpoConfig({ config: {} } as Parameters<typeof createExpoConfig>[0])
    expect(config.runtimeVersion).toBe("0.5.11")
  })
})

describe("resolveRuntimeVersion", () => {
  it("keeps the development runtime version stable", () => {
    expect(
      resolveRuntimeVersion({
        isDevelopment: true,
        packageVersion: "0.4.2",
        otaRuntimeVersionOverride: "0.4.1",
      }),
    ).toBe("0.0.0-dev")
  })

  it("uses OTA_RUNTIME_VERSION for OTA exports", () => {
    expect(
      resolveRuntimeVersion({
        isDevelopment: false,
        packageVersion: "0.4.2",
        otaRuntimeVersionOverride: "0.4.1",
      }),
    ).toBe("0.4.1")
  })

  it("rejects invalid OTA runtime versions", () => {
    expect(() =>
      resolveRuntimeVersion({
        isDevelopment: false,
        packageVersion: "0.4.2",
        otaRuntimeVersionOverride: "0.4",
      }),
    ).toThrow(/OTA_RUNTIME_VERSION/i)
  })
})

describe("Android media permissions", () => {
  const config = createExpoConfig({
    config: {},
  } as Parameters<typeof createExpoConfig>[0])

  it("blocks broad media access that is not required by the app", () => {
    expect(config.android?.blockedPermissions).toEqual([
      "android.permission.ACCESS_MEDIA_LOCATION",
      "android.permission.CAMERA",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.READ_MEDIA_AUDIO",
      "android.permission.READ_MEDIA_IMAGES",
      "android.permission.READ_MEDIA_VIDEO",
      "android.permission.READ_MEDIA_VISUAL_USER_SELECTED",
      "android.permission.RECORD_AUDIO",
    ])
  })

  it("configures media APIs for picker and write-only access", () => {
    expect(config.plugins).toContainEqual([
      "expo-media-library",
      {
        photosPermission: "Allow $(PRODUCT_NAME) to access your photos.",
        savePhotosPermission: "Allow $(PRODUCT_NAME) to save photos.",
        isAccessMediaLocationEnabled: false,
        granularPermissions: [],
      },
    ])
    expect(config.plugins).toContainEqual([
      "expo-image-picker",
      {
        photosPermission: "Allow $(PRODUCT_NAME) to access your photos.",
        cameraPermission: false,
        microphonePermission: false,
      },
    ])
  })
})
