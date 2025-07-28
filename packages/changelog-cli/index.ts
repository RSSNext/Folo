#!/usr/bin/env tsx

import "dotenv/config"

import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { dirname, join } from "pathe"

import type { ChangelogEntry } from "./ai-agent"
import AIAgent from "./ai-agent"
import GitTools from "./git-tools"

// Get current directory
const __dirname = dirname(fileURLToPath(import.meta.url))
const changelogDir = join(__dirname, "..", "..", "apps", "mobile", "changelog")
const configPath = join(__dirname, "config.json")

interface Config {
  internalTeamMembers: string[]
  aiModel: {
    provider: string
    model: string
    temperature: number
    maxTokens: number
    baseURL?: string
    customEndpoint?: string
  }
  commitAnalysis: {
    categories: Record<
      string,
      {
        keywords: string[]
        section: string
      }
    >
    ignorePatterns: string[]
  }
  changelog: {
    maxCommitsPerSection: number
    includeCommitHash: boolean
    includePullRequestLinks: boolean
  }
}

/**
 * Load configuration from file
 */
function loadConfig(): Config {
  try {
    const configContent = readFileSync(configPath, "utf-8")
    return JSON.parse(configContent)
  } catch (error) {
    console.error("Failed to load config file:", error)
    process.exit(1)
  }
}

/**
 * Format changelog entry for output
 */
function formatChangelogEntry(entry: ChangelogEntry, config: Config): string {
  let line = `- ${entry.description}`

  if (config.changelog.includePullRequestLinks && entry.pullRequest) {
    line += `(#${entry.pullRequest})`
  } else if (config.changelog.includeCommitHash && entry.commitHash) {
    line += `(${entry.commitHash})`
  }

  return line
}

/**
 * Group changelog entries by section
 */
function groupEntriesBySection(entries: ChangelogEntry[]): Record<string, ChangelogEntry[]> {
  const grouped: Record<string, ChangelogEntry[]> = {
    "Shiny new things": [],
    Improvements: [],
    "No longer broken": [],
  }

  entries.forEach((entry) => {
    if (grouped[entry.section]) {
      grouped[entry.section]!.push(entry)
    }
  })

  return grouped
}

/**
 * Generate the changelog content
 */
function generateChangelogContent(
  version: string,
  entries: ChangelogEntry[],
  contributors: string[],
  config: Config,
): string {
  const groupedEntries = groupEntriesBySection(entries)

  let content = `# What's New in v${version}\n\n`

  // Add sections with entries
  Object.entries(groupedEntries).forEach(([section, sectionEntries]) => {
    content += `## ${section}\n\n`

    if (sectionEntries.length > 0) {
      // Limit entries per section
      const limitedEntries = sectionEntries.slice(0, config.changelog.maxCommitsPerSection)
      limitedEntries.forEach((entry) => {
        content += `${formatChangelogEntry(entry, config)}\n`
      })
    }

    content += "\n"
  })

  // Add contributors section
  content += "## Thanks\n\n"
  if (contributors.length > 0) {
    const contributorList = contributors.map((name) => `@${name}`).join(" ")
    content += `Special thanks to volunteer contributors ${contributorList} for their valuable contributions\n`
  } else {
    content += "Special thanks to volunteer contributors @ for their valuable contributions\n"
  }

  return content
}

/**
 * Main function to generate changelog
 */
async function main() {
  try {
    console.info("🤖 Starting AI-driven changelog generation...")

    // Load configuration
    const config = loadConfig()
    console.info("✅ Configuration loaded")

    // Initialize Git tools
    const git = new GitTools()

    // Check if we're on a release branch
    if (!git.isOnReleaseBranch()) {
      console.error("❌ This script should only be run on a release branch (release/mobile/*)")
      process.exit(1)
    }

    // Get version from branch name
    const version = git.getVersionFromBranch()
    if (!version) {
      console.error("❌ Could not extract version from branch name")
      process.exit(1)
    }

    console.info(`📝 Generating changelog for version: ${version}`)

    // Get the latest mobile tag
    const latestTag = git.getLatestMobileTag()
    if (!latestTag) {
      console.error("❌ No previous mobile tags found")
      process.exit(1)
    }

    console.info(`📌 Latest tag: ${latestTag.name}`)

    // Get commits between latest tag and current HEAD
    const currentCommit = git.getLatestCommitHash()
    const commits = git.getCommitsBetween(latestTag.hash, currentCommit)

    console.info(`🔍 Found ${commits.length} commits since last release`)

    if (commits.length === 0) {
      console.warn("⚠️  No new commits found since last release")
      return
    }

    // Initialize AI agent
    const aiAgent = new AIAgent(config.aiModel, config.commitAnalysis.categories as any)

    // Analyze commits with AI
    const changelogEntries = await aiAgent.analyzeCommits(commits)
    console.info(`✨ Generated ${changelogEntries.length} changelog entries`)

    // Get contributors
    const contributors = git.getUniqueAuthors(commits, config.internalTeamMembers)
    console.info(`👥 Found ${contributors.length} external contributors`)

    // Generate changelog content
    const changelogContent = generateChangelogContent(
      version,
      changelogEntries,
      contributors,
      config,
    )

    // Write to next.md
    const nextFilePath = join(changelogDir, "next.md")
    writeFileSync(nextFilePath, changelogContent, "utf-8")

    console.info("✅ Changelog generated successfully!")
    console.info(`📄 Updated: ${nextFilePath}`)

    // Show preview
    console.info("\n📋 Preview:")
    console.info("─".repeat(50))
    console.info(changelogContent)
    console.info("─".repeat(50))
  } catch (error) {
    console.error("❌ Failed to generate changelog:", error)
    process.exit(1)
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export default main
