import { afterEach, describe, expect, it, vi } from "vitest"

const extra: Record<string, unknown> = {}
vi.mock("expo-constants", () => ({ default: { expoConfig: { extra } } }))

const { getE2EEnvProfile, getE2ELanguage } = await import("./e2e-config")

describe("e2e config", () => {
  afterEach(() => {
    for (const key of Object.keys(extra)) delete extra[key]
    vi.unstubAllEnvs()
  })

  it("reads the profile and language from the app config", () => {
    extra.e2eEnvProfile = "local"
    extra.e2eLanguage = "ja"
    expect(getE2EEnvProfile()).toBe("local")
    expect(getE2ELanguage()).toBe("ja")
  })

  it("ignores the empty objects the native app config writes for null", () => {
    extra.e2eEnvProfile = {}
    extra.e2eLanguage = {}
    expect(getE2EEnvProfile()).toBeNull()
    expect(getE2ELanguage()).toBeNull()
  })

  it("falls back to the bundle env when the app config has no value", () => {
    extra.e2eEnvProfile = {}
    vi.stubEnv("EXPO_PUBLIC_E2E_ENV_PROFILE", "local")
    expect(getE2EEnvProfile()).toBe("local")
  })
})
