#!/usr/bin/env node

/**
 * Extract release version and platform information from git commit messages
 * Used by GitHub Actions to determine if a release tag should be created
 */

import { execSync } from "node:child_process"
import { appendFileSync } from "node:fs"
import { pathToFileURL } from "node:url"

// Configuration
const RELEASE_PATTERNS = {
  desktop: /^release\(desktop\): Release (v\d+\.\d+\.\d+(?:-[0-9A-Z-.]+)?)(?: \(#\d+\))?$/i,
  mobile: /^release\(mobile\): Release (v\d+\.\d+\.\d+(?:-[0-9A-Z-.]+)?)(?: \(#\d+\))?$/i,
}

const RELEASE_PLATFORM_BY_REF = {
  main: "desktop",
  "mobile-main": "mobile",
}

const GITHUB_MERGE_SUBJECT_PATTERN = /^Merge pull request #\d+ from /i

const EXIT_CODES = {
  SUCCESS: 0,
  GIT_ERROR: 2,
  ENV_ERROR: 3,
  OUTPUT_ERROR: 4,
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
 * Write output variable to GitHub Output
 * @param {string} key - Output key
 * @param {string} value - Output value
 */
function setGitHubOutput(key, value) {
  try {
    if (!process.env.GITHUB_OUTPUT) {
      return
    }
    appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`)
  } catch (error) {
    console.error(`Failed to set output variable ${key}:`, error.message)
    process.exit(EXIT_CODES.OUTPUT_ERROR)
  }
}

/**
 * Get the latest commit message
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
 * Extract release information from a commit message.
 * Prefer the subject. For a standard GitHub merge commit, fall back only to the first non-empty body
 * line, where GitHub stores the PR title. When a GitHub ref is available, only the platform released
 * from that branch is considered. Other body lines are ignored so stale release commits cannot
 * retrigger a release.
 * @param {string} commitMessage - Git commit message
 * @param {string|undefined} refName - GitHub ref name
 * @returns {{platform: string, version: string, tagName: string}|null} Release information or null
 */
export function extractReleaseInfo(commitMessage, refName = process.env.GITHUB_REF_NAME) {
  const [commitSubject = "", ...commitBodyLines] = commitMessage.split(/\r?\n/)
  const expectedPlatform = refName ? RELEASE_PLATFORM_BY_REF[refName] : undefined

  if (refName && !expectedPlatform) {
    return null
  }

  const platforms = expectedPlatform ? [expectedPlatform] : Object.keys(RELEASE_PATTERNS)
  const candidates = [commitSubject.trim()]

  if (GITHUB_MERGE_SUBJECT_PATTERN.test(commitSubject)) {
    const pullRequestTitle = commitBodyLines.map((line) => line.trim()).find(Boolean)
    if (pullRequestTitle) {
      candidates.push(pullRequestTitle)
    }
  }

  for (const candidate of candidates) {
    for (const platform of platforms) {
      const match = candidate.match(RELEASE_PATTERNS[platform])
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
      process.exit(EXIT_CODES.SUCCESS)
    }

    const { platform, version, tagName } = releaseInfo

    // Set GitHub Environment variables
    setGitHubEnv("tag_version", tagName)
    setGitHubEnv("platform", platform)
    setGitHubEnv("version", version)
    setGitHubOutput("tag_version", tagName)
    setGitHubOutput("platform", platform)
    setGitHubOutput("version", version)

    console.info(`Found ${platform} release: ${version}`)
    console.info(`Tag will be created: ${tagName}`)

    process.exit(EXIT_CODES.SUCCESS)
  } catch (error) {
    console.error("Unexpected error:", error.message)
    process.exit(EXIT_CODES.GIT_ERROR)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
