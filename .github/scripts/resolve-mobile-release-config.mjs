#!/usr/bin/env node

import { appendFileSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { pathToFileURL } from "node:url"

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/
const VALID_MODES = new Set(["store", "ota"])
const VALID_CHANNELS = new Set(["production", "preview"])

export function resolveMobileReleaseConfig(input) {
  const normalizedReleaseVersion = input.releaseVersion.replace(/^v/, "")
  const config = input.releaseConfig

  if (config.version !== normalizedReleaseVersion) {
    throw new Error(
      `apps/mobile/release.json version ${config.version} does not match release version ${normalizedReleaseVersion}.`,
    )
  }

  if (!VALID_MODES.has(config.mode)) {
    throw new Error("apps/mobile/release.json mode must be store or ota.")
  }

  if (config.mode === "store") {
    return {
      triggerStoreBuilds: true,
      triggerOtaPublish: false,
      runtimeVersion: null,
      channel: null,
      releaseVersion: normalizedReleaseVersion,
    }
  }

  if (!config.runtimeVersion || !SEMVER_PATTERN.test(config.runtimeVersion)) {
    throw new Error("apps/mobile/release.json runtimeVersion must be a plain x.y.z version.")
  }

  if (!config.channel || !VALID_CHANNELS.has(config.channel)) {
    throw new Error("apps/mobile/release.json channel must be production or preview.")
  }

  return {
    triggerStoreBuilds: false,
    triggerOtaPublish: true,
    runtimeVersion: config.runtimeVersion,
    channel: config.channel,
    releaseVersion: normalizedReleaseVersion,
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

  appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`)
}

async function main() {
  try {
    const configPath = process.env.RELEASE_CONFIG_PATH ?? "apps/mobile/release.json"
    const releaseConfig = await readReleaseConfig(configPath)
    const result = resolveMobileReleaseConfig({
      releaseVersion: process.env.RELEASE_VERSION ?? "",
      releaseConfig,
    })

    setGitHubOutput("trigger_store_builds", String(result.triggerStoreBuilds))
    setGitHubOutput("trigger_ota_publish", String(result.triggerOtaPublish))
    setGitHubOutput("runtime_version", result.runtimeVersion ?? "")
    setGitHubOutput("channel", result.channel ?? "")
    setGitHubOutput("release_version", result.releaseVersion)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
