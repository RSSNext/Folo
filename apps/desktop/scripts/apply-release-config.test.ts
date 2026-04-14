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

describe("applyDesktopReleaseConfig", () => {
  it("writes release.json for ota mode, resets release-plan.json, and persists the plan runtimeVersion", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "desktop-release-config-"))
    tempDirs.push(projectDir)

    await writeFile(
      join(projectDir, "package.json"),
      `${JSON.stringify({ name: "Folo", version: "1.5.0" }, null, 2)}\n`,
      "utf8",
    )
    await writeFile(
      join(projectDir, "release-plan.json"),
      `${JSON.stringify(
        {
          mode: "ota",
          runtimeVersion: "1.5.0",
          channel: "stable",
        },
        null,
        2,
      )}\n`,
      "utf8",
    )

    const { applyReleaseConfig } = await import("./apply-release-config.impl.ts")

    await applyReleaseConfig({ projectDir, version: "1.5.1" })

    await expect(readFile(join(projectDir, "release.json"), "utf8")).resolves.toContain(
      '"mode": "ota"',
    )
    await expect(readFile(join(projectDir, "release.json"), "utf8")).resolves.toContain(
      '"runtimeVersion": "1.5.0"',
    )
    await expect(readFile(join(projectDir, "release-plan.json"), "utf8")).resolves.toContain(
      '"mode": "build"',
    )
    await expect(readFile(join(projectDir, "package.json"), "utf8")).resolves.toContain(
      '"runtimeVersion": "1.5.0"',
    )
  })

  it("persists the new app version as runtimeVersion for build mode", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "desktop-release-config-"))
    tempDirs.push(projectDir)

    await writeFile(
      join(projectDir, "package.json"),
      `${JSON.stringify({ name: "Folo", version: "1.5.0", runtimeVersion: "1.4.9" }, null, 2)}\n`,
      "utf8",
    )
    await writeFile(
      join(projectDir, "release-plan.json"),
      `${JSON.stringify(
        {
          mode: "build",
          runtimeVersion: null,
          channel: null,
        },
        null,
        2,
      )}\n`,
      "utf8",
    )

    const { applyReleaseConfig } = await import("./apply-release-config.impl.ts")

    await applyReleaseConfig({ projectDir, version: "1.5.1" })

    await expect(readFile(join(projectDir, "package.json"), "utf8")).resolves.toContain(
      '"runtimeVersion": "1.5.1"',
    )
  })

  it("rejects ota mode when the channel is missing", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "desktop-release-config-"))
    tempDirs.push(projectDir)

    await writeFile(
      join(projectDir, "package.json"),
      `${JSON.stringify({ name: "Folo", version: "1.5.0" }, null, 2)}\n`,
      "utf8",
    )
    await writeFile(
      join(projectDir, "release-plan.json"),
      `${JSON.stringify(
        {
          mode: "ota",
          runtimeVersion: "1.5.0",
          channel: null,
        },
        null,
        2,
      )}\n`,
      "utf8",
    )

    const { applyReleaseConfig } = await import("./apply-release-config.impl.ts")

    await expect(() => applyReleaseConfig({ projectDir, version: "1.5.1" })).rejects.toThrow(
      /desktop ota mode requires a channel/i,
    )
  })
})
