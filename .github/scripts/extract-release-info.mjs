#!/usr/bin/env node

/**
 * Extract release version and platform information from git commit messages
 * Used by GitHub Actions to determine if a release tag should be created
 */

import { execSync } from "node:child_process"
import { appendFileSync } from "node:fs"

// Configuration
const RELEASE_PATTERNS = {
  desktop: /release\(desktop\): Release (v\d+\.\d+\.\d+(-[0-9A-Z-.]+)?)/i,
  mobile: /release\(mobile\): Release (v\d+\.\d+\.\d+(-[0-9A-Z-.]+)?)/i,
}

const EXIT_CODES = {
  SUCCESS: 0,
  NO_RELEASE_FOUND: 1,
  GIT_ERROR: 2,
  ENV_ERROR: 3,
}

/**
 * Write environment variable to GitHub Environment
 * @param {string} key - Environment variable key
 * @param {string} value - Environment variable value
 */
function setGitHubEnv(key, value) {
  try {
    if (!process.env.GITHUB_ENV) {
      throw new Error("GITHUB_ENV not set - not running in GitHub Actions")
    }
    appendFileSync(process.env.GITHUB_ENV, `${key}=${value}\n`)
  } catch (error) {
    console.error(`Failed to set environment variable ${key}:`, error.message)
    process.exit(EXIT_CODES.ENV_ERROR)
  }
}

/**
 * Get the latest commit message
 * @returns {string} Latest commit message
 */
function getLatestCommitMessage() {
  try {
    return execSync("git log -1 --pretty=%B", { encoding: "utf-8" }).toString().trim()
  } catch (error) {
    console.error("Failed to get git commit message:", error.message)
    process.exit(EXIT_CODES.GIT_ERROR)
  }
}

/**
 * Extract release information from commit message
 * @param {string} commitMessage - Git commit message
 * @returns {Object|null} Release information or null if no release found
 */
function extractReleaseInfo(commitMessage) {
  for (const [platform, regex] of Object.entries(RELEASE_PATTERNS)) {
    const match = commitMessage.match(regex)
    if (match) {
      const version = match[1]
      const tagName = `${platform}/${version}`

      return {
        platform,
        version,
        tagName,
      }
    }
  }

  return null
}

/**
 * Main execution function
 */
function main() {
  try {
    console.info("Extracting release information from commit message...")

    const commitMessage = getLatestCommitMessage()
    console.info(`Commit message: ${commitMessage}`)

    const releaseInfo = extractReleaseInfo(commitMessage)

    if (!releaseInfo) {
      console.info("No desktop or mobile release found in commit message.")
      process.exit(EXIT_CODES.NO_RELEASE_FOUND)
    }

    const { platform, version, tagName } = releaseInfo

    // Set GitHub Environment variables
    setGitHubEnv("tag_version", tagName)
    setGitHubEnv("platform", platform)
    setGitHubEnv("version", version)

    console.info(`Found ${platform} release: ${version}`)
    console.info(`Tag will be created: ${tagName}`)

    process.exit(EXIT_CODES.SUCCESS)
  } catch (error) {
    console.error("Unexpected error:", error.message)
    process.exit(EXIT_CODES.GIT_ERROR)
  }
}

main()
