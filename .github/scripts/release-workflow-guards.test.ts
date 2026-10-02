import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

const workflow = (name: string) =>
  readFileSync(new URL(`../workflows/${name}`, import.meta.url), "utf8")

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

  // The sync PRs that merge main and mobile-main back into dev are opened with GITHUB_TOKEN, which
  // starts no pull_request workflows. Their auto-merge waits for dev's required checks, so those
  // checks have to run on pushes to both release branches.
  it("runs dev's required checks on pushes to both release branches", () => {
    for (const name of ["lint.yml", "build-web.yml"]) {
      const pushBranches = workflow(name).match(/^ {2}push:\n {4}branches: \[([^\]]*)\]$/m)?.[1]
      const branches = pushBranches?.split(",").map((branch) => branch.trim())

      expect(branches).toEqual(expect.arrayContaining(["main", "dev", "mobile-main"]))
    }
  })
})
