import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

const workflow = (name: string) => readFileSync(`.github/workflows/${name}`, "utf8")

describe("release build workflow guards", () => {
  it("skips direct mobile push builds for desktop release commits on main", () => {
    const androidWorkflow = workflow("build-android.yml")
    const iosWorkflow = workflow("build-ios.yml")

    expect(androidWorkflow).toContain("github.ref == 'refs/heads/main'")
    expect(androidWorkflow).toContain("release(desktop):")

    expect(iosWorkflow).toContain("github.ref == 'refs/heads/main'")
    expect(iosWorkflow).toContain("release(desktop):")
  })

  it("skips direct desktop push builds for mobile release commits on mobile-main", () => {
    const desktopWorkflow = workflow("build-desktop.yml")

    expect(desktopWorkflow).toContain("github.ref == 'refs/heads/mobile-main'")
    expect(desktopWorkflow).toContain("release(mobile):")
  })
})
