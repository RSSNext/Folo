import { describe, expect, it } from "vitest"

import { getStoreUpdateTarget, shouldPromptStoreUpdate } from "../store-update"

describe("shouldPromptStoreUpdate", () => {
  const prompt = { action: "prompt" as const, targetVersion: "0.6.0", message: null }

  it("stays quiet without a newer store version", () => {
    expect(shouldPromptStoreUpdate(null, null)).toBe(false)
    expect(
      shouldPromptStoreUpdate({ action: "none", targetVersion: null, message: null }, null),
    ).toBe(false)
  })

  it("prompts for a version the user has not put off", () => {
    expect(shouldPromptStoreUpdate(prompt, null)).toBe(true)
    expect(shouldPromptStoreUpdate(prompt, "0.5.12")).toBe(true)
  })

  it("does not prompt again for the version the user put off", () => {
    expect(shouldPromptStoreUpdate(prompt, "0.6.0")).toBe(false)
  })

  it("always asks when the installed version is blocked", () => {
    expect(shouldPromptStoreUpdate({ ...prompt, action: "block" }, "0.6.0")).toBe(true)
  })
})

describe("getStoreUpdateTarget", () => {
  it("sends iOS to the App Store", () => {
    expect(getStoreUpdateTarget({ platform: "ios", isGooglePlayInstall: false })).toMatchObject({
      store: "app_store",
      url: expect.stringContaining("apps.apple.com"),
    })
  })

  it("sends Google Play installs to the Play Store app", () => {
    expect(getStoreUpdateTarget({ platform: "android", isGooglePlayInstall: true })).toEqual({
      store: "google_play",
      appUrl: "market://details?id=is.follow",
      url: "https://play.google.com/store/apps/details?id=is.follow",
    })
  })

  it("has no store for APKs installed outside Google Play", () => {
    expect(getStoreUpdateTarget({ platform: "android", isGooglePlayInstall: false })).toBeNull()
  })
})
