import { createRequire } from "node:module"

import { describe, expect, it } from "vitest"

const { addLaunchLinkGuard } = createRequire(import.meta.url)(
  "./with-android-launch-link-guard.js",
) as { addLaunchLinkGuard: (contents: string) => string }

// The onCreate of Expo's MainActivity template, after expo-splash-screen's change
const MAIN_ACTIVITY = `class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    // setTheme(R.style.AppTheme);
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen
    super.onCreate(null)
  }
}`

describe("addLaunchLinkGuard", () => {
  it("drops the launch link of a restore before onCreate hands the intent on", () => {
    const contents = addLaunchLinkGuard(MAIN_ACTIVITY)
    const guard = contents.indexOf("intent.data = null")

    expect(guard).toBeGreaterThan(contents.indexOf("SplashScreenManager.registerOnActivity"))
    expect(guard).toBeLessThan(contents.indexOf("super.onCreate(null)"))
    expect(contents).toContain("savedInstanceState != null")
    expect(contents).toContain("Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY")
  })

  it("adds the guard once however often prebuild runs", () => {
    const once = addLaunchLinkGuard(MAIN_ACTIVITY)

    expect(addLaunchLinkGuard(once)).toBe(once)
    expect(once.split("intent.data = null")).toHaveLength(2)
  })
})
