import { execSync } from "node:child_process"
import { fileURLToPath } from "node:url"

import { dirname, join } from "pathe"

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, "..", "..")

export interface GitCommit {
  hash: string
  shortHash: string
  subject: string
  body: string
  author: string
  email: string
  date: string
  pullRequest?: string
}

export interface GitTag {
  name: string
  hash: string
  date: string
}

export class GitTools {
  private workingDir: string

  constructor(workingDir = projectRoot) {
    this.workingDir = workingDir
  }

  /**
   * Execute git command and return output
   */
  private exec(command: string): string {
    try {
      return execSync(command, {
        cwd: this.workingDir,
        encoding: "utf-8",
      }).trim()
    } catch (error) {
      console.error(`Git command failed: ${command}`)
      throw error
    }
  }

  /**
   * Get the latest tag for mobile releases
   */
  getLatestMobileTag(): GitTag | null {
    try {
      const tags = this.exec('git tag --sort=-version:refname | grep "^mobile@" | head -1')
      if (!tags) return null

      const tagName = tags.trim()
      const hash = this.exec(`git rev-list -n 1 ${tagName}`)
      const date = this.exec(`git log -1 --format=%ai ${hash}`)

      return {
        name: tagName,
        hash,
        date,
      }
    } catch {
      return null
    }
  }

  /**
   * Get current branch name
   */
  getCurrentBranch(): string {
    return this.exec("git rev-parse --abbrev-ref HEAD")
  }

  /**
   * Get the latest commit hash on current branch
   */
  getLatestCommitHash(): string {
    return this.exec("git rev-parse HEAD")
  }

  /**
   * Get commits between two references
   */
  getCommitsBetween(fromRef: string, toRef: string): GitCommit[] {
    const format = [
      "%H", // full hash
      "%h", // short hash
      "%s", // subject
      "%b", // body
      "%an", // author name
      "%ae", // author email
      "%ai", // author date
    ].join("%x1f") // use ASCII unit separator

    const command = `git log --format="${format}%x1e" ${fromRef}..${toRef}`
    const output = this.exec(command)

    if (!output) return []

    return output
      .split("\x1e")
      .filter(Boolean)
      .map((entry) => {
        const parts = entry.split("\x1f")
        const [hash, shortHash, subject, body, author, email, date] = parts

        // Ensure all required fields exist
        if (!hash || !shortHash || !subject || !author || !email || !date) {
          throw new Error("Invalid git log entry format")
        }

        // Check if commit is related to a pull request
        const pullRequest = this.extractPullRequestNumber(subject, body || "")

        return {
          hash: hash.trim(),
          shortHash: shortHash.trim(),
          subject: subject.trim(),
          body: (body || "").trim(),
          author: author.trim(),
          email: email.trim(),
          date: date.trim(),
          pullRequest,
        }
      })
  }

  /**
   * Extract pull request number from commit message
   */
  private extractPullRequestNumber(subject: string, body: string): string | undefined {
    const text = `${subject} ${body}`
    const prMatch = text.match(/#(\d+)/)
    return prMatch ? prMatch[1] : undefined
  }

  /**
   * Get all unique authors from commits, excluding bots and internal members
   */
  getUniqueAuthors(commits: GitCommit[], internalMembers: string[]): string[] {
    const authors = new Set<string>()

    commits.forEach((commit) => {
      const author = commit.author.toLowerCase()
      const isBotOrInternal =
        author.includes("[bot]") ||
        author.includes("bot") ||
        internalMembers.some((member) => author.includes(member.toLowerCase()))

      if (!isBotOrInternal) {
        authors.add(commit.author)
      }
    })

    return Array.from(authors).sort()
  }

  /**
   * Check if we're on a release branch
   */
  isOnReleaseBranch(): boolean {
    const currentBranch = this.getCurrentBranch()
    return currentBranch.startsWith("release/")
  }

  /**
   * Get the version from release branch name
   */
  getVersionFromBranch(): string | null {
    const currentBranch = this.getCurrentBranch()
    const match = currentBranch.match(/release\/mobile\/(.+)/)
    return match?.[1] ?? null
  }
}

export default GitTools
