import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"

import { join } from "pathe"
import { afterEach, describe, expect, it } from "vitest"

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  )
})

describe("apply-release-config", () => {
  it("writes release.json for the new version and resets release-plan.json", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "apply-release-config-test-"))
    tempDirs.push(projectDir)

    await writeFile(
      join(projectDir, "release-plan.json"),
      JSON.stringify(
        {
          mode: "ota",
          runtimeVersion: "0.4.1",
          channel: "production",
          storeRequired: false,
          message: null,
        },
        null,
        2,
      ),
      "utf8",
    )

    const { applyReleaseConfig } = await import("./apply-release-config.impl.ts")

    await applyReleaseConfig({
      projectDir,
      version: "0.4.2",
    })

    await expect(readFile(join(projectDir, "release.json"), "utf8")).resolves.toContain(
      '"version": "0.4.2"',
    )
    await expect(readFile(join(projectDir, "release.json"), "utf8")).resolves.toContain(
      '"mode": "ota"',
    )
    await expect(readFile(join(projectDir, "release-plan.json"), "utf8")).resolves.toContain(
      '"mode": "store"',
    )
  })
})
