import { execFile } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { promisify } from "node:util"

import { join } from "pathe"
import { describe, expect, it } from "vitest"

const execFileAsync = promisify(execFile)

describe("resolveDesktopReleaseConfig", () => {
  it("triggers direct and store builds for build mode", async () => {
    const { resolveDesktopReleaseConfig } = await import("./resolve-desktop-release-config.mjs")

    expect(
      resolveDesktopReleaseConfig({
        releaseVersion: "v1.5.1",
        releaseConfig: {
          version: "1.5.1",
          mode: "build",
          runtimeVersion: null,
          channel: null,
        },
      }),
    ).toEqual({
      triggerDirectBuild: true,
      triggerStoreBuilds: true,
      runtimeVersion: null,
      channel: null,
      releaseVersion: "1.5.1",
    })
  })

  it("triggers direct and store builds for ota mode", async () => {
    const { resolveDesktopReleaseConfig } = await import("./resolve-desktop-release-config.mjs")

    expect(
      resolveDesktopReleaseConfig({
        releaseVersion: "v1.5.1",
        releaseConfig: {
          version: "1.5.1",
          mode: "ota",
          runtimeVersion: "1.5.0",
          channel: "stable",
        },
      }),
    ).toEqual({
      triggerDirectBuild: true,
      triggerStoreBuilds: true,
      runtimeVersion: "1.5.0",
      channel: "stable",
      releaseVersion: "1.5.1",
    })
  })

  it("rejects a release config that does not match the release version", async () => {
    const { resolveDesktopReleaseConfig } = await import("./resolve-desktop-release-config.mjs")

    expect(() =>
      resolveDesktopReleaseConfig({
        releaseVersion: "v1.5.2",
        releaseConfig: {
          version: "1.5.1",
          mode: "build",
          runtimeVersion: null,
          channel: null,
        },
      }),
    ).toThrow(/does not match release version/i)
  })

  it("rejects build mode when runtimeVersion or channel is set", async () => {
    const { resolveDesktopReleaseConfig } = await import("./resolve-desktop-release-config.mjs")

    expect(() =>
      resolveDesktopReleaseConfig({
        releaseVersion: "v1.5.2",
        releaseConfig: {
          version: "1.5.2",
          mode: "build",
          runtimeVersion: "1.5.1",
          channel: "stable",
        },
      }),
    ).toThrow(/must not set runtimeVersion or channel/i)
  })

  it("writes GitHub outputs for ota mode", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "desktop-release-config-output-"))

    try {
      const releaseConfigPath = join(projectDir, "release.json")
      const githubOutputPath = join(projectDir, "github-output.txt")

      await writeFile(
        releaseConfigPath,
        `${JSON.stringify(
          {
            version: "1.5.2",
            mode: "ota",
            runtimeVersion: "1.5.1",
            channel: "beta",
          },
          null,
          2,
        )}\n`,
        "utf8",
      )

      await execFileAsync("node", [".github/scripts/resolve-desktop-release-config.mjs"], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          RELEASE_VERSION: "1.5.2",
          RELEASE_CONFIG_PATH: releaseConfigPath,
          GITHUB_OUTPUT: githubOutputPath,
        },
      })

      const output = await readFile(githubOutputPath, "utf8")

      expect(output).toContain("triggerDirectBuild=true")
      expect(output).toContain("triggerStoreBuilds=true")
      expect(output).toContain("runtimeVersion<<")
      expect(output).toContain("1.5.1")
      expect(output).toContain("channel<<")
      expect(output).toContain("beta")
    } finally {
      await rm(projectDir, { recursive: true, force: true })
    }
  })
})
