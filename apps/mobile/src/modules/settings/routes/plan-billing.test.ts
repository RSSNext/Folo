import { describe, expect, it } from "vitest"

import { canChangeSubscriptionHere, getSubscriptionManagement } from "./plan-billing"

describe("plan billing rules", () => {
  it("lets a Google Play install buy and change only Google Play subscriptions", () => {
    expect(canChangeSubscriptionHere(null, "google-play")).toBe(true)
    expect(canChangeSubscriptionHere("google", "google-play")).toBe(true)
    expect(canChangeSubscriptionHere("stripe", "google-play")).toBe(false)
    expect(canChangeSubscriptionHere("apple", "google-play")).toBe(false)

    expect(getSubscriptionManagement("google", "google-play")).toBe("manage-button")
    expect(getSubscriptionManagement("stripe", "google-play")).toBe("other-platform-hint")
    expect(getSubscriptionManagement("apple", "google-play")).toBe("other-platform-hint")
  })

  it("keeps store subscriptions in their own store on iOS and the APK", () => {
    expect(canChangeSubscriptionHere("apple", "app-store")).toBe(true)
    expect(canChangeSubscriptionHere("stripe", "app-store")).toBe(true)
    expect(canChangeSubscriptionHere("google", "app-store")).toBe(false)
    expect(getSubscriptionManagement("apple", "app-store")).toBe("apple-hint")
    expect(getSubscriptionManagement("stripe", "app-store")).toBe("manage-button")
    expect(getSubscriptionManagement("google", "app-store")).toBe("other-platform-hint")

    expect(canChangeSubscriptionHere(null, "stripe")).toBe(true)
    expect(canChangeSubscriptionHere("stripe", "stripe")).toBe(true)
    expect(canChangeSubscriptionHere("google", "stripe")).toBe(false)
    expect(canChangeSubscriptionHere("apple", "stripe")).toBe(false)
    expect(getSubscriptionManagement("apple", "stripe")).toBe("apple-hint")
    expect(getSubscriptionManagement("google", "stripe")).toBe("other-platform-hint")
  })
})
