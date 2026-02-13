---
name: desktop-release
description: Perform a regular desktop release from the dev branch. Gathers commits since last release, updates changelog, evaluates mainHash changes, bumps version, and creates release PR.
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Desktop Regular Release

Perform a regular desktop release. This skill handles the full release workflow from the `dev` branch.

## Pre-flight checks

1. Confirm the current branch is `dev`. If not, abort with a warning.
2. Run `git pull --rebase` in the repo root to ensure the local branch is up to date.
3. Read `apps/desktop/package.json` to get the current `version` and `mainHash`.

## Step 1: Gather changes since last release

1. Find the last release tag:
   ```bash
   git tag --sort=-creatordate | grep '^desktop/v' | head -1
   ```
2. Get all commits since that tag on the current branch:
   ```bash
   git log <last-tag>..HEAD --oneline --no-merges
   ```
3. Categorize commits into:
   - **Shiny new things** (feat: commits, new features)
   - **Improvements** (refactor:, perf:, chore: improvements, dependency updates)
   - **No longer broken** (fix: commits, bug fixes)
   - **Thanks** (identify external contributor GitHub usernames from commits)

## Step 2: Update changelog

1. Read `apps/desktop/changelog/next.md`.
2. Present the categorized changes to the user and draft the changelog content.
3. Wait for user confirmation or edits before writing.
4. Write the final content to `apps/desktop/changelog/next.md`, following the template format:

   ```markdown
   # What's new in vNEXT_VERSION

   ## Shiny new things

   - description of new feature

   ## Improvements

   - description of improvement

   ## No longer broken

   - description of fix

   ## Thanks

   Special thanks to volunteer contributors @username for their valuable contributions
   ```

5. Keep `NEXT_VERSION` as the placeholder - it will be replaced by `apply-changelog.ts` during bump.

## Step 3: Evaluate mainHash

This is critical for determining whether users need a full app update or can use the lightweight renderer hot update.

1. Check what files changed in `apps/desktop/layer/main/` since the last release tag:
   ```bash
   git diff <last-tag>..HEAD --name-only -- apps/desktop/layer/main/
   ```
2. Also check changes to `apps/desktop/package.json` fields other than version/mainHash (since package.json is included in the hash calculation):
   ```bash
   git diff <last-tag>..HEAD -- apps/desktop/package.json
   ```

**Decision logic:**

- If there are **NO changes** in `layer/main/` and no meaningful `package.json` changes (only version/mainHash/changelog-related), then mainHash should NOT be updated. Users will get a fast renderer-only hot update.
- If there are **trivial changes** in `layer/main/` (typo fixes, comment changes, logging tweaks) that don't affect runtime behavior, recommend NOT updating mainHash. Present the changes to the user and ask for confirmation.
- If there are **meaningful changes** in `layer/main/` (new features, bug fixes, dependency changes, API changes), mainHash MUST be updated. Users will need a full app update.

Present your analysis to the user with:

- List of changed files in `layer/main/`
- A summary of what changed
- Your recommendation (update or skip mainHash)
- Ask for explicit confirmation

## Step 4: Prepare bump config

Based on the mainHash decision:

**If mainHash should NOT be updated:**

Temporarily modify `apps/desktop/bump.config.ts` to remove the `generate-main-hash.ts` step from the `leading` array. Remove this line:

```
"tsx plugins/vite/generate-main-hash.ts",
```

Remember to restore it after the bump completes.

**If mainHash should be updated:**

No changes needed to `bump.config.ts` - the default behavior calculates and updates mainHash automatically.

## Step 5: Execute bump

1. Change directory to `apps/desktop/`:
   ```bash
   cd apps/desktop && pnpm bump
   ```
2. This command will:
   - Pull latest changes
   - Apply changelog (rename next.md to {version}.md, create new next.md)
   - Optionally recalculate mainHash (if not removed in Step 4)
   - Format package.json
   - Bump minor version
   - Commit with message `release(desktop): release v{NEW_VERSION}`
   - Create branch `release/desktop/{NEW_VERSION}`
   - Push branch and create PR to `main`

3. If bump.config.ts was modified in Step 4, restore it now:
   ```bash
   git checkout apps/desktop/bump.config.ts
   ```

## Step 6: Verify

1. Confirm the PR was created successfully by checking the output.
2. Report the new version number and PR URL to the user.
3. Summarize:
   - New version: v{NEW_VERSION}
   - mainHash updated: yes/no (and why)
   - Changelog highlights
   - PR URL

## Reference

- Bump config: `apps/desktop/bump.config.ts`
- Changelog dir: `apps/desktop/changelog/`
- Changelog template: `apps/desktop/changelog/next.template.md`
- mainHash generator: `apps/desktop/plugins/vite/generate-main-hash.ts`
- Hot updater logic: `apps/desktop/layer/main/src/updater/hot-updater.ts`
- CI build workflow: `.github/workflows/build-desktop.yml`
- Tag workflow: `.github/workflows/tag.yml`
