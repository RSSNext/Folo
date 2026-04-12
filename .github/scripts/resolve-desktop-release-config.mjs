#!/usr/bin/env node

import { appendFileSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { pathToFileURL } from "node:url"

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/
const VALID_MODES = new Set(["build", "ota"])
const VALID_CHANNELS = new Set(["stable", "beta", "alpha"])

export function resolveDesktopReleaseConfig(input) {
  const normalizedReleaseVersion = input.releaseVersion.replace(/^v/, "")
  const config = input.releaseConfig

  if (config.version !== normalizedReleaseVersion) {
    throw new Error(
      `apps/desktop/release.json version ${config.version} does not match release version ${normalizedReleaseVersion}.`,
    )
  }

  if (!VALID_MODES.has(config.mode)) {
    throw new Error("apps/desktop/release.json mode must be build or ota.")
  }

  if (config.mode === "build") {
    if (config.runtimeVersion !== null || config.channel !== null) {
      throw new Error("desktop build mode must not set runtimeVersion or channel")
    }

    return {
      triggerDirectBuild: true,
      triggerStoreBuilds: true,
      runtimeVersion: null,
      channel: null,
      releaseVersion: normalizedReleaseVersion,
    }
  }

  if (config.mode === "ota") {
    if (!config.runtimeVersion || !SEMVER_PATTERN.test(config.runtimeVersion)) {
      throw new Error("apps/desktop/release.json runtimeVersion must be a plain x.y.z version.")
    }

    if (!config.channel || !VALID_CHANNELS.has(config.channel)) {
      throw new Error("apps/desktop/release.json channel must be stable, beta, or alpha.")
    }

    return {
      triggerDirectBuild: true,
      triggerStoreBuilds: true,
      runtimeVersion: config.runtimeVersion,
      channel: config.channel,
      releaseVersion: normalizedReleaseVersion,
    }
  }
}

async function readReleaseConfig(path) {
  const raw = await readFile(path, "utf8")
  return JSON.parse(raw)
}

function setGitHubOutput(key, value) {
  if (!process.env.GITHUB_OUTPUT) {
    return
  }

  const delimiter = `__GITHUB_OUTPUT_${key}_${Date.now()}_${Math.random().toString(16).slice(2)}__`
  appendFileSync(process.env.GITHUB_OUTPUT, `${key}<<${delimiter}\n${value}\n${delimiter}\n`)
}

async function main() {
  try {
    const configPath = process.env.RELEASE_CONFIG_PATH ?? "apps/desktop/release.json"
    const releaseConfig = await readReleaseConfig(configPath)
    const result = resolveDesktopReleaseConfig({
      releaseVersion: process.env.RELEASE_VERSION ?? "",
      releaseConfig,
    })

    setGitHubOutput("triggerDirectBuild", String(result.triggerDirectBuild))
    setGitHubOutput("triggerStoreBuilds", String(result.triggerStoreBuilds))
    setGitHubOutput("runtimeVersion", result.runtimeVersion ?? "")
    setGitHubOutput("channel", result.channel ?? "")
    setGitHubOutput("releaseVersion", result.releaseVersion)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
