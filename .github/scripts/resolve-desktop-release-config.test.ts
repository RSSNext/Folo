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
          distributions: [],
          required: false,
          message: null,
        },
      }),
    ).toEqual({
      triggerDirectBuild: true,
      triggerStoreBuilds: true,
      triggerMetadataPublish: false,
      releaseKind: null,
      runtimeVersion: null,
      channel: null,
      distributions: "",
      required: "",
      policyMessage: "",
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
          distributions: ["direct"],
          required: false,
          message: null,
        },
      }),
    ).toEqual({
      triggerDirectBuild: true,
      triggerStoreBuilds: true,
      triggerMetadataPublish: false,
      releaseKind: "ota",
      runtimeVersion: "1.5.0",
      channel: "stable",
      distributions: "direct",
      required: "false",
      policyMessage: "",
      releaseVersion: "1.5.1",
    })
  })

  it("triggers metadata publishing only for binary-policy mode", async () => {
    const { resolveDesktopReleaseConfig } = await import("./resolve-desktop-release-config.mjs")

    expect(
      resolveDesktopReleaseConfig({
        releaseVersion: "v1.5.2",
        releaseConfig: {
          version: "1.5.2",
          mode: "binary-policy",
          runtimeVersion: null,
          channel: "beta",
          distributions: ["mas", "mss"],
          required: true,
          message: "Install the store binary update.",
        },
      }),
    ).toEqual({
      triggerDirectBuild: false,
      triggerStoreBuilds: false,
      triggerMetadataPublish: true,
      releaseKind: "binary",
      runtimeVersion: null,
      channel: "beta",
      distributions: "mas,mss",
      required: "true",
      policyMessage: "Install the store binary update.",
      releaseVersion: "1.5.2",
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
          distributions: [],
          required: false,
          message: null,
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
          distributions: [],
          required: false,
          message: null,
        },
      }),
    ).toThrow(/must not set runtimeVersion or channel/i)
  })

  it("writes GitHub outputs safely for multiline policy messages", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "desktop-release-config-output-"))

    try {
      const releaseConfigPath = join(projectDir, "release.json")
      const githubOutputPath = join(projectDir, "github-output.txt")

      await writeFile(
        releaseConfigPath,
        `${JSON.stringify(
          {
            version: "1.5.2",
            mode: "binary-policy",
            runtimeVersion: null,
            channel: "beta",
            distributions: ["mas"],
            required: true,
            message: "Install the new build.\nStore rollout is required.",
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

      expect(output).toContain("policyMessage<<")
      expect(output).toContain("Install the new build.\nStore rollout is required.")
      expect(output).not.toContain("policyMessage=Install the new build.\n")
    } finally {
      await rm(projectDir, { recursive: true, force: true })
    }
  })
})
