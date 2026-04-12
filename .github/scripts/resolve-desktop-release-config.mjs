#!/usr/bin/env node

import { appendFileSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { pathToFileURL } from "node:url"

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/
const VALID_MODES = new Set(["build", "ota", "binary-policy"])
const VALID_CHANNELS = new Set(["stable", "beta", "alpha"])
const VALID_DISTRIBUTIONS = new Set(["direct", "mas", "mss"])

export function resolveDesktopReleaseConfig(input) {
  const normalizedReleaseVersion = input.releaseVersion.replace(/^v/, "")
  const config = input.releaseConfig

  if (config.version !== normalizedReleaseVersion) {
    throw new Error(
      `apps/desktop/release.json version ${config.version} does not match release version ${normalizedReleaseVersion}.`,
    )
  }

  if (!VALID_MODES.has(config.mode)) {
    throw new Error("apps/desktop/release.json mode must be build, ota, or binary-policy.")
  }

  if (
    !Array.isArray(config.distributions) ||
    config.distributions.some((item) => !VALID_DISTRIBUTIONS.has(item))
  ) {
    throw new Error(
      "apps/desktop/release.json distributions must only contain direct, mas, or mss.",
    )
  }

  if (config.mode === "build") {
    if (config.runtimeVersion !== null || config.channel !== null) {
      throw new Error("desktop build mode must not set runtimeVersion or channel")
    }

    return {
      triggerDirectBuild: true,
      triggerStoreBuilds: true,
      triggerMetadataPublish: false,
      releaseKind: null,
      runtimeVersion: null,
      channel: null,
      distributions: "",
      required: "",
      policyMessage: "",
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
      triggerMetadataPublish: false,
      releaseKind: "ota",
      runtimeVersion: config.runtimeVersion,
      channel: config.channel,
      distributions: config.distributions.join(","),
      required: String(config.required ?? false),
      policyMessage: "",
      releaseVersion: normalizedReleaseVersion,
    }
  }

  if (!config.channel || !VALID_CHANNELS.has(config.channel)) {
    throw new Error("apps/desktop/release.json channel must be stable, beta, or alpha.")
  }

  if (config.distributions.length === 0) {
    throw new Error(
      "apps/desktop/release.json binary-policy mode requires at least one distribution.",
    )
  }

  return {
    triggerDirectBuild: false,
    triggerStoreBuilds: false,
    triggerMetadataPublish: true,
    releaseKind: "binary",
    runtimeVersion: null,
    channel: config.channel,
    distributions: config.distributions.join(","),
    required: String(config.required ?? false),
    policyMessage: config.message ?? "",
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
    setGitHubOutput("triggerMetadataPublish", String(result.triggerMetadataPublish))
    setGitHubOutput("releaseKind", result.releaseKind ?? "")
    setGitHubOutput("runtimeVersion", result.runtimeVersion ?? "")
    setGitHubOutput("channel", result.channel ?? "")
    setGitHubOutput("distributions", result.distributions ?? "")
    setGitHubOutput("required", result.required ?? "")
    setGitHubOutput("policyMessage", result.policyMessage ?? "")
    setGitHubOutput("releaseVersion", result.releaseVersion)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
