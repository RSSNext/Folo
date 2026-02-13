---
name: update-deps
description: Update all dependencies across frontend and backend projects. Reads changelogs for breaking changes, checks affected code, runs tests, and provides a summary. Use when updating npm dependencies across the monorepo.
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, WebFetch, WebSearch, Task
---

# Update All Dependencies

Update all npm dependencies across the frontend (current repo) and backend projects. This skill handles the full update workflow including changelog review, code impact analysis, testing, and summarization.

## Step 0: Ask for backend directory

Ask the user for the backend project directory path. Do NOT hardcode any path. Example prompt:

> Please provide the backend project directory path (e.g., `/path/to/backend`).

Wait for the user's response before proceeding. Save the path as `BACKEND_DIR` for later use.

## Step 1: Analyze current dependencies

### Frontend (current repo)

1. Run `pnpm outdated --recursive` in the current repo root to identify all outdated dependencies.
2. Save the full output for later analysis.

### Backend

1. Run `pnpm outdated --recursive` in `BACKEND_DIR` to identify all outdated dependencies.
2. Save the full output for later analysis.

Present the user with a summary of how many dependencies are outdated in each project.

## Step 2: Update dependencies

### Strategy

Update in two phases to isolate issues:

**Phase 1 — Patch and minor updates (safer):**

1. Frontend: Run `pnpm update --recursive` in the repo root (updates within semver range).
2. Backend: Run `pnpm update --recursive` in `BACKEND_DIR`.

**Phase 2 — Major updates (requires careful review):**

For each dependency with a major version update available:

1. Identify the dependency name, current version, and latest version.
2. **Read the changelog** (Step 3) before updating.
3. Only update after confirming no blocking breaking changes.
4. Use `pnpm update <package>@latest --recursive` to update specific packages.

**Important pnpm workspace notes:**

- The frontend project uses `pnpm catalog` in `pnpm-workspace.yaml` for some shared versions. If a dependency is managed via catalog, update the version in `pnpm-workspace.yaml` instead of individual `package.json` files.
- Both projects use `save-exact=true`, so versions are pinned without `^` or `~`.
- Check `patchedDependencies` in `pnpm-workspace.yaml` or `package.json` — if a patched dependency is being updated, verify the patch still applies or remove it if no longer needed.

## Step 3: Review changelogs for major updates

For each dependency with a **major version update**, you MUST read the changelog before updating.

### How to find changelogs

Use these methods in order of preference:

1. **npm registry**: Run `npm view <package> repository.url` to find the repo, then check for `CHANGELOG.md` or GitHub releases.
2. **GitHub releases**: Search `https://github.com/<owner>/<repo>/releases` using WebFetch.
3. **Web search**: Use WebSearch to find `<package> changelog <old-version> to <new-version>`.

### What to look for

- **Breaking changes**: API removals, renamed exports, changed defaults, dropped Node.js version support.
- **Deprecated features**: Features being removed in future versions.
- **Migration guides**: Official upgrade instructions.
- **Peer dependency changes**: New or changed peer dependency requirements.

### Document findings

For each major update, record:

- Package name and version change (e.g., `foo: 2.x → 3.x`)
- Breaking changes summary
- Whether our code is affected (and how)

## Step 4: Check affected code

For each dependency with breaking changes identified in Step 3:

1. Use `Grep` to find all imports and usages of the affected package across the relevant project (frontend or backend).
2. Read the files containing usages.
3. Compare the usage against the breaking change description.
4. If our code uses an affected API:
   - Attempt to fix the code following the migration guide.
   - If the fix is complex or risky, **skip updating this dependency** and note it in the summary.
5. If our code does NOT use any affected API, proceed with the update.

## Step 5: Run tests and checks

After all updates are applied:

### Frontend

Run these commands sequentially in the repo root and capture results:

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm lint
```

### Backend

Run these commands sequentially in `BACKEND_DIR` and capture results:

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm lint
```

### Handle failures

- **TypeScript errors**: Read the error output, identify which updated dependency caused the issue, and fix the type errors. If unfixable, revert that specific dependency update.
- **Test failures**: Analyze the failure, check if it's related to a dependency update, and fix or revert.
- **Lint errors**: Run `pnpm lint:fix` first. If issues persist, fix manually or revert the causing update.

Repeat the test cycle until all checks pass.

## Step 6: Summary

Present the user with a comprehensive summary:

### Update report

```
## Dependencies Updated

### Frontend
- <package>: <old-version> → <new-version> (patch/minor/major)
- ...

### Backend
- <package>: <old-version> → <new-version> (patch/minor/major)
- ...

## Skipped Updates (with reasons)
- <package>: <reason why not updated>
- ...

## Key Changelog Highlights

### Breaking Changes Applied
- <package> <version>: <what changed and how we adapted>

### Notable New Features
- <package> <version>: <brief description>

### Deprecation Warnings
- <package> <version>: <what's deprecated and timeline>

## Test Results
- Frontend typecheck: ✅/❌
- Frontend tests: ✅/❌
- Frontend lint: ✅/❌
- Backend typecheck: ✅/❌
- Backend tests: ✅/❌
- Backend lint: ✅/❌
```

Ask the user if they want to commit the changes.
