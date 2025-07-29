# @follow/changelog-cli

AI-driven changelog generator for the Follow project. This package automatically analyzes git commits and generates user-friendly changelog entries using configurable AI models.

## Features

- 🤖 **AI-Powered Analysis**: Uses OpenAI GPT models to analyze commit messages
- 📊 **Smart Categorization**: Automatically categorizes changes into sections
- 👥 **Contributor Recognition**: Identifies and thanks external contributors
- 🔧 **Configurable**: Supports custom AI endpoints and models
- 🔄 **Fallback Support**: Falls back to keyword-based analysis if AI is unavailable

## Installation

This package is part of the Follow monorepo and is not published to npm. It's designed to be used within the monorepo environment.

## Usage

### As a Workspace Script

From the mobile app directory:

```bash
npm run changelog:generate
```

### Direct Execution

From the package directory:

```bash
pnpm run generate
```

### CLI Command (after building)

```bash
pnpm run build
./bin/cli.js
```

## Configuration

Create or modify `config.json` in the package root:

```json
{
  "internalTeamMembers": [
    "innei",
    "DIYgod",
    "hyoban",
    "renovate[bot]",
    "github-actions[bot]",
    "dependabot[bot]",
    "vercel[bot]"
  ],
  "aiModel": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "temperature": 0.3,
    "maxTokens": 1000,
    "apiKey": "",
    "baseURL": "https://api.openai.com/v1",
    "customEndpoint": ""
  },
  "commitAnalysis": {
    "categories": {
      "features": {
        "keywords": ["feat", "feature", "add", "implement", "introduce"],
        "section": "Shiny new things"
      },
      "improvements": {
        "keywords": ["improve", "enhance", "optimize", "refactor", "update", "perf"],
        "section": "Improvements"
      },
      "fixes": {
        "keywords": ["fix", "bug", "patch", "resolve", "correct"],
        "section": "No longer broken"
      }
    },
    "ignorePatterns": [
      "^chore:",
      "^docs:",
      "^test:",
      "^ci:",
      "^build:",
      "Merge pull request",
      "Merge branch",
      "version bump",
      "changelog",
      "Update dependencies"
    ]
  },
  "changelog": {
    "maxCommitsPerSection": 5,
    "includeCommitHash": true,
    "includePullRequestLinks": true
  }
}
```

## Custom OpenAI Endpoints

The tool supports custom OpenAI-compatible endpoints:

### Environment Variables

```bash
export OPENAI_API_KEY="your-api-key"
export OPENAI_BASE_URL="https://your-custom-endpoint.com/v1"
```

### Configuration File

```json
{
  "aiModel": {
    "apiKey": "your-api-key",
    "customEndpoint": "https://your-custom-endpoint.com/v1"
  }
}
```

### Supported Providers

- OpenAI API
- Azure OpenAI
- Any OpenAI-compatible API (e.g., Claude via proxy, local models)

## Requirements

- Node.js >= 18.0.0
- Git repository with proper tag structure (`mobile@x.y.z`)
- Must be run on a release branch (`release/mobile/*`)

## How It Works

1. **Branch Validation**: Ensures execution on a release branch
2. **Git Analysis**: Finds commits between latest mobile tag and current HEAD
3. **Commit Filtering**: Removes noise commits (merges, version bumps, etc.)
4. **AI Analysis**: Sends filtered commits to AI for categorization
5. **Contributor Detection**: Identifies external contributors from commit authors
6. **Changelog Generation**: Formats and writes changelog to target file

## Files Structure

- `index.ts` - Main entry point and orchestration logic
- `git-tools.ts` - Git command execution and analysis
- `ai-agent.ts` - AI-powered commit analysis and categorization
- `openai-client.ts` - OpenAI API client with custom endpoint support
- `config.json` - Configuration file
- `bin/cli.js` - CLI executable wrapper

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm run dev

# Type checking
pnpm run typecheck

# Build for production
pnpm run build
```

## Integration

This package is designed to integrate with the existing release workflow in the Follow monorepo. It can be called from other apps' package.json scripts or integrated into the bump configuration.

Example integration in mobile app's `package.json`:

```json
{
  "scripts": {
    "changelog:generate": "tsx ../packages/changelog-cli/index.ts"
  }
}
```

## License

This package is part of the Follow project and follows the same license terms.
