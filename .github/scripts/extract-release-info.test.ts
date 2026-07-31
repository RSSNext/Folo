import { execFile } from "node:child_process"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

import { join } from "pathe"
import { describe, expect, it } from "vitest"

import { extractReleaseInfo } from "./extract-release-info.mjs"

const execFileAsync = promisify(execFile)

describe("extractReleaseInfo", () => {
  it("recognizes a mobile release from the subject and ignores old desktop markers in the body", () => {
    const commitMessage = [
      "release(mobile): Release v0.5.7 (#5061)",
      "",
      "* release(desktop): release v1.11.0",
      "* docs(mobile): restore desktop release inputs",
    ].join("\n")

    expect(extractReleaseInfo(commitMessage, "mobile-main")).toEqual({
      platform: "mobile",
      version: "v0.5.7",
      tagName: "mobile/v0.5.7",
    })
  })

  it("rejects a release subject on the wrong target branch", () => {
    expect(extractReleaseInfo("release(mobile): Release v0.5.7", "main")).toBeNull()
    expect(extractReleaseInfo("release(desktop): Release v1.12.0", "mobile-main")).toBeNull()
  })

  it("recognizes the target platform release from a standard merge commit body", () => {
    const commitMessage = [
      "Merge pull request #5061 from RSSNext/release/mobile/0.5.7",
      "",
      "release(mobile): Release v0.5.7",
    ].join("\n")

    expect(extractReleaseInfo(commitMessage, "mobile-main")).toEqual({
      platform: "mobile",
      version: "v0.5.7",
      tagName: "mobile/v0.5.7",
    })
  })

  it("ignores ordinary commits", () => {
    expect(extractReleaseInfo("fix(mobile): restore release metadata", "mobile-main")).toBeNull()
  })

  it("ignores release markers for the wrong platform in a merge commit body", () => {
    const commitMessage = [
      "Merge pull request #5061 from RSSNext/release/mobile/0.5.7",
      "",
      "release(mobile): Release v0.5.7",
    ].join("\n")

    expect(extractReleaseInfo(commitMessage, "main")).toBeNull()
  })

  it("ignores stale release markers later in an ordinary commit body", () => {
    const commitMessage = [
      "chore(sync): merge mobile-main into dev",
      "",
      "* release(mobile): Release v0.5.6",
    ].join("\n")

    expect(extractReleaseInfo(commitMessage, "mobile-main")).toBeNull()
  })

  it("does not use a stale body marker when another platform release is the subject", () => {
    const commitMessage = [
      "release(desktop): Release v1.6.0",
      "",
      "* release(mobile): Release v0.4.1",
    ].join("\n")

    expect(extractReleaseInfo(commitMessage, "mobile-main")).toBeNull()
  })

  it("recognizes a desktop release on main", () => {
    expect(extractReleaseInfo("release(desktop): Release v1.12.0", "main")).toEqual({
      platform: "desktop",
      version: "v1.12.0",
      tagName: "desktop/v1.12.0",
    })
  })

  it("falls back to subject-based platform detection without a GitHub ref", () => {
    const originalRefName = process.env.GITHUB_REF_NAME
    delete process.env.GITHUB_REF_NAME

    try {
      expect(extractReleaseInfo("release(mobile): Release v0.5.7")).toEqual({
        platform: "mobile",
        version: "v0.5.7",
        tagName: "mobile/v0.5.7",
      })
    } finally {
      if (originalRefName === undefined) {
        delete process.env.GITHUB_REF_NAME
      } else {
        process.env.GITHUB_REF_NAME = originalRefName
      }
    }
  })

  it("writes the existing GitHub environment and output values from the latest subject", async () => {
    const repositoryDir = await mkdtemp(join(tmpdir(), "extract-release-info-"))

    try {
      const githubEnvPath = join(repositoryDir, "github-env.txt")
      const githubOutputPath = join(repositoryDir, "github-output.txt")
      const scriptPath = fileURLToPath(new URL("./extract-release-info.mjs", import.meta.url))

      await execFileAsync("git", ["init"], { cwd: repositoryDir })
      await execFileAsync("git", ["config", "user.name", "Release Test"], {
        cwd: repositoryDir,
      })
      await execFileAsync("git", ["config", "user.email", "release-test@example.com"], {
        cwd: repositoryDir,
      })
      await execFileAsync(
        "git",
        [
          "commit",
          "--allow-empty",
          "-m",
          "release(mobile): Release v0.5.7 (#5061)",
          "-m",
          "* release(desktop): release v1.11.0",
        ],
        { cwd: repositoryDir },
      )

      await execFileAsync("node", [scriptPath], {
        cwd: repositoryDir,
        env: {
          ...process.env,
          GITHUB_ENV: githubEnvPath,
          GITHUB_OUTPUT: githubOutputPath,
          GITHUB_REF_NAME: "mobile-main",
        },
      })

      const githubEnv = await readFile(githubEnvPath, "utf8")
      const githubOutput = await readFile(githubOutputPath, "utf8")

      expect(githubEnv).toContain("tag_version=mobile/v0.5.7")
      expect(githubEnv).toContain("platform=mobile")
      expect(githubEnv).toContain("version=v0.5.7")
      expect(githubOutput).toContain("tag_version=mobile/v0.5.7")
      expect(githubOutput).toContain("platform=mobile")
      expect(githubOutput).toContain("version=v0.5.7")
    } finally {
      await rm(repositoryDir, { recursive: true, force: true })
    }
  })
})
