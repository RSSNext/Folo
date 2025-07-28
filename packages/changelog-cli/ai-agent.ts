import type { GitCommit } from "./git-tools"
import OpenAIClient from "./openai-client"

export interface ChangelogEntry {
  section: "Shiny new things" | "Improvements" | "No longer broken"
  description: string
  commitHash?: string
  pullRequest?: string
}

export interface AIConfig {
  provider: string
  model: string
  temperature: number
  maxTokens: number
  apiKey?: string
}

export interface CommitCategory {
  keywords: string[]
  section: "Shiny new things" | "Improvements" | "No longer broken"
}

export class AIAgent {
  private config: AIConfig
  private categories: Record<string, CommitCategory>
  private openaiClient: OpenAIClient

  constructor(config: AIConfig, categories: Record<string, CommitCategory>) {
    this.config = config
    this.categories = categories
    this.openaiClient = new OpenAIClient(config)
  }

  /**
   * Analyze commits and generate changelog entries using AI
   */
  async analyzeCommits(commits: GitCommit[]): Promise<ChangelogEntry[]> {
    console.info(`Analyzing ${commits.length} commits with AI...`)

    const filteredCommits = this.filterImportantCommits(commits)
    console.info(`Selected ${filteredCommits.length} important commits`)

    const changelogEntries: ChangelogEntry[] = []

    // Process commits in batches to avoid API limits
    const batchSize = 10
    for (let i = 0; i < filteredCommits.length; i += batchSize) {
      const batch = filteredCommits.slice(i, i + batchSize)
      const batchEntries = await this.processBatch(batch)
      changelogEntries.push(...batchEntries)
    }

    return changelogEntries
  }

  /**
   * Filter commits to identify important ones
   */
  private filterImportantCommits(commits: GitCommit[]): GitCommit[] {
    return commits.filter((commit) => {
      const message = `${commit.subject} ${commit.body}`.toLowerCase()

      // Skip ignored patterns
      const shouldIgnore = [
        /^chore:/,
        /^docs:/,
        /^test:/,
        /^ci:/,
        /^build:/,
        /merge pull request/,
        /merge branch/,
        /version bump/,
        /changelog/,
        /update dependencies/,
        /^\d+\.\d+\.\d+/, // version numbers
        /^bump /,
        /^release\(/,
      ].some((pattern) => pattern.test(message))

      if (shouldIgnore) return false

      // Include commits with significant changes
      const hasSignificantChange = [
        /\bfeat\b/,
        /\bfeature\b/,
        /\badd\b/,
        /\bimplement\b/,
        /\bintroduce\b/,
        /\bfix\b/,
        /\bbug\b/,
        /\bpatch\b/,
        /\bresolve\b/,
        /\bcorrect\b/,
        /\bimprove\b/,
        /\benhance\b/,
        /\boptimize\b/,
        /\brefactor\b/,
        /\bupdate\b/,
        /\bperf\b/,
        /\bbreaking\b/,
        /\bmajor\b/,
        /\bminor\b/,
        /\bui\b/,
        /\bux\b/,
        /\bdesign\b/,
      ].some((pattern) => pattern.test(message))

      return hasSignificantChange || commit.pullRequest
    })
  }

  /**
   * Process a batch of commits using AI
   */
  private async processBatch(commits: GitCommit[]): Promise<ChangelogEntry[]> {
    const prompt = this.buildAnalysisPrompt(commits)

    try {
      const aiResponse = await this.callAI(prompt)
      return this.parseAIResponse(aiResponse, commits)
    } catch (error) {
      console.warn("AI analysis failed, falling back to keyword-based categorization:", error)
      return this.fallbackCategorization(commits)
    }
  }

  /**
   * Build the analysis prompt for AI
   */
  private buildAnalysisPrompt(commits: GitCommit[]): string {
    const commitsText = commits
      .map(
        (commit, index) =>
          `${index + 1}. [${commit.shortHash}] ${commit.subject}\n   ${commit.body || "No description"}\n   ${commit.pullRequest ? `PR #${commit.pullRequest}` : ""}`,
      )
      .join("\n\n")

    return `You are a technical writer creating a changelog for a React Native RSS reader app called "Follow". 

Analyze these git commits and categorize the most important user-facing changes into these sections:

**Shiny new things**: New features, major additions that users can see/use
**Improvements**: Enhancements, optimizations, better UX/UI, performance improvements  
**No longer broken**: Bug fixes, crash fixes, issues resolved

For each relevant commit, provide:
1. A user-friendly description (not technical jargon)
2. Which section it belongs to
3. Reference the commit hash or PR number if significant

Focus on changes that impact the user experience. Skip internal refactoring, dependency updates, or development-only changes unless they significantly affect users.

Commits to analyze:
${commitsText}

Respond in this JSON format:
{
  "entries": [
    {
      "section": "Shiny new things",
      "description": "User-friendly description of what changed",
      "commitHash": "abc123",
      "pullRequest": "1234"
    }
  ]
}

Only include meaningful user-facing changes. Be selective and focus on quality over quantity.`
  }

  /**
   * Call AI API (mock implementation - you need to implement the actual API call)
   */
  private async callAI(prompt: string): Promise<string> {
    // This is a mock implementation. You need to implement the actual AI API call
    // based on your chosen provider (OpenAI, Anthropic, etc.)

    if (this.config.provider === "openai") {
      return this.callOpenAI(prompt)
    }

    throw new Error(`AI provider "${this.config.provider}" not implemented`)
  }

  /**
   * OpenAI API call implementation
   */
  private async callOpenAI(prompt: string): Promise<string> {
    if (!this.openaiClient.isAvailable()) {
      throw new Error("OpenAI API not available")
    }

    console.info("🤖 Calling OpenAI API...")
    return await this.openaiClient.chat(prompt)
  }

  /**
   * Parse AI response into changelog entries
   */
  private parseAIResponse(response: string, commits: GitCommit[]): ChangelogEntry[] {
    try {
      const parsed = JSON.parse(response)
      return parsed.entries || []
    } catch {
      console.warn("Failed to parse AI response, using fallback")
      return this.fallbackCategorization(commits)
    }
  }

  /**
   * Fallback categorization using keywords when AI fails
   */
  private fallbackCategorization(commits: GitCommit[]): ChangelogEntry[] {
    return commits.map((commit) => {
      const message = `${commit.subject} ${commit.body}`.toLowerCase()

      // Determine category based on keywords
      let section: ChangelogEntry["section"] = "Improvements"

      if (this.categories.features?.keywords.some((keyword) => message.includes(keyword))) {
        section = "Shiny new things"
      } else if (this.categories.fixes?.keywords.some((keyword) => message.includes(keyword))) {
        section = "No longer broken"
      }

      // Clean up the description
      let description = commit.subject
      if (
        description.startsWith("feat:") ||
        description.startsWith("fix:") ||
        description.startsWith("chore:")
      ) {
        description = description.slice(Math.max(0, description.indexOf(":") + 1)).trim()
      }

      // Capitalize first letter
      description = description.charAt(0).toUpperCase() + description.slice(1)

      return {
        section,
        description,
        commitHash: commit.shortHash,
        pullRequest: commit.pullRequest,
      }
    })
  }
}

export default AIAgent
