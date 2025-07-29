# Usage Examples

This document provides practical examples of how to use the `@follow/changelog-cli` package in different scenarios.

## Basic Usage

### 1. Generate Changelog for Current Release

Make sure you're on a release branch (e.g., `release/mobile/0.2.5`):

```bash
# From mobile app directory
cd apps/mobile
npm run changelog:generate

# Or from the package directory
cd packages/changelog-cli
pnpm run generate
```

### 2. Using with Custom OpenAI Endpoint

If you're using a custom OpenAI-compatible endpoint (like Azure OpenAI or a local model):

```bash
# Set environment variables
export OPENAI_API_KEY="your-api-key"
export OPENAI_BASE_URL="https://your-endpoint.openai.azure.com/v1"

# Run the generator
npm run changelog:generate
```

### 3. Configuration for Different AI Providers

#### Azure OpenAI

```json
{
  "aiModel": {
    "provider": "openai",
    "model": "gpt-4",
    "apiKey": "your-azure-key",
    "customEndpoint": "https://your-resource.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2024-02-15-preview"
  }
}
```

#### Local Model (Ollama)

```json
{
  "aiModel": {
    "provider": "openai",
    "model": "llama2",
    "apiKey": "not-needed",
    "customEndpoint": "http://localhost:11434/v1"
  }
}
```

#### Claude via Proxy

```json
{
  "aiModel": {
    "provider": "openai",
    "model": "claude-3-sonnet-20240229",
    "apiKey": "your-anthropic-key",
    "customEndpoint": "https://api.anthropic.com/v1"
  }
}
```

## Integration Examples

### 1. Auto-generate during Release Process

Add to `apps/mobile/bump.config.ts`:

```typescript
export default defineConfig({
  leading: [
    "git pull --rebase",
    "npm run changelog:generate", // Add this line
    "tsx scripts/apply-changelog.ts ${NEW_VERSION}",
    "git add changelog",
    // ... rest of config
  ],
  // ...
})
```

### 2. CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Generate Changelog
on:
  push:
    branches:
      - "release/mobile/*"

jobs:
  changelog:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Important: fetch full history

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install

      - name: Generate changelog
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          cd apps/mobile
          npm run changelog:generate

      - name: Commit changelog
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add apps/mobile/changelog/next.md
          git commit -m "chore: auto-generate changelog" || exit 0
          git push
```

### 3. Custom Script Integration

Create a custom script that uses the changelog CLI:

```typescript
// scripts/release-workflow.ts
import { execSync } from "node:child_process"

async function releaseWorkflow() {
  console.log("🚀 Starting release workflow...")

  // 1. Generate changelog
  console.log("📝 Generating changelog...")
  execSync("npm run changelog:generate", {
    cwd: "apps/mobile",
    stdio: "inherit",
  })

  // 2. Review and edit if needed
  console.log("📋 Changelog generated. Please review before continuing.")

  // 3. Continue with release process...
}

releaseWorkflow()
```

## Configuration Examples

### 1. Team-specific Configuration

For different teams with different internal members:

```json
{
  "internalTeamMembers": [
    "innei",
    "DIYgod",
    "hyoban",
    "team-lead-1",
    "team-lead-2",
    "renovate[bot]",
    "dependabot[bot]"
  ]
}
```

### 2. Project-specific Keywords

Customize keywords for different types of projects:

```json
{
  "commitAnalysis": {
    "categories": {
      "features": {
        "keywords": ["feat", "feature", "add", "implement", "new"],
        "section": "🎉 New Features"
      },
      "improvements": {
        "keywords": ["improve", "enhance", "optimize", "perf", "refactor"],
        "section": "⚡ Improvements"
      },
      "fixes": {
        "keywords": ["fix", "bug", "patch", "resolve", "hotfix"],
        "section": "🐛 Bug Fixes"
      }
    }
  }
}
```

### 3. Strict Filtering

For projects with very specific changelog requirements:

```json
{
  "commitAnalysis": {
    "ignorePatterns": [
      "^chore:",
      "^docs:",
      "^test:",
      "^ci:",
      "^build:",
      "^style:",
      "^refactor:",
      "Merge pull request",
      "Merge branch",
      "version bump",
      "changelog",
      "Update dependencies",
      "^deps:",
      "^devDeps:"
    ]
  },
  "changelog": {
    "maxCommitsPerSection": 3,
    "includeCommitHash": false,
    "includePullRequestLinks": true
  }
}
```

## Troubleshooting Examples

### 1. API Rate Limiting

If you hit OpenAI API rate limits:

```json
{
  "aiModel": {
    "temperature": 0.1,
    "maxTokens": 500
  }
}
```

Or process commits in smaller batches by modifying the batch size in `ai-agent.ts`.

### 2. Custom Git Tag Format

If your project uses a different tag format, modify `git-tools.ts`:

```typescript
// In git-tools.ts, modify getLatestMobileTag()
getLatestMobileTag(): GitTag | null {
  try {
    // Change this line to match your tag format
    const tags = this.exec('git tag --sort=-version:refname | grep "^v" | head -1')
    // ... rest of the method
  }
}
```

### 3. Working with Monorepos

For complex monorepo setups, you might need to adjust the working directory:

```typescript
// Create a custom git tools instance
const git = new GitTools("/path/to/your/specific/repo")
```

## Best Practices

### 1. Review Before Committing

Always review the generated changelog before committing:

```bash
# Generate changelog
npm run changelog:generate

# Review the changes
cat apps/mobile/changelog/next.md

# Edit if necessary
vim apps/mobile/changelog/next.md

# Commit when satisfied
git add apps/mobile/changelog/next.md
git commit -m "chore: update changelog"
```

### 2. Backup Configuration

Keep your configuration in version control but sensitive data in environment variables:

```json
{
  "aiModel": {
    "apiKey": "", // Leave empty in version control
    "customEndpoint": "" // Can be committed if not sensitive
  }
}
```

### 3. Testing Configuration

Test your configuration with a small batch first:

```json
{
  "changelog": {
    "maxCommitsPerSection": 1, // Start small
    "includeCommitHash": true,
    "includePullRequestLinks": true
  }
}
```

This way you can verify the output format before processing many commits.
