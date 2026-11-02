import { describe, expect, it, vi } from "vitest"

vi.mock("react-native-device-info", () => ({
  default: { getInstallerPackageNameSync: vi.fn() },
}))

vi.mock("./platform", () => ({ isAndroid: true }))

const { getAndroidInstallSource, resolveMobileBillingProvider } = await import("./payment")

describe("mobile billing provider", () => {
  it("tells Google Play installs from other installers", () => {
    expect(getAndroidInstallSource("com.android.vending")).toBe("google-play")
    expect(getAndroidInstallSource("com.google.android.packageinstaller")).toBe("other")
    expect(getAndroidInstallSource("org.fdroid.fdroid")).toBe("other")
    expect(getAndroidInstallSource("unknown")).toBe("unknown")
    expect(getAndroidInstallSource(null)).toBe("unknown")
  })

  it("never offers Stripe unless the app was installed outside Google Play", () => {
    expect(resolveMobileBillingProvider({ isAndroid: true, installSource: "google-play" })).toBe(
      "google-play",
    )
    expect(resolveMobileBillingProvider({ isAndroid: true, installSource: "unknown" })).toBe(
      "google-play",
    )
    expect(resolveMobileBillingProvider({ isAndroid: true, installSource: "other" })).toBe("stripe")
    expect(resolveMobileBillingProvider({ isAndroid: false, installSource: "unknown" })).toBe(
      "app-store",
    )
  })
})
