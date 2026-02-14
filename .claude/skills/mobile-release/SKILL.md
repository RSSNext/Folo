---
name: mobile-release
description: Perform a regular mobile release from the dev branch. Gathers commits since last release, updates changelog, bumps version, updates iOS Info.plist, and creates release PR to mobile-main.
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Mobile Regular Release

Perform a regular mobile release. This skill handles the full release workflow from the `dev` branch.

## Pre-flight checks

1. Confirm the current branch is `dev`. If not, abort with a warning.
2. Run `git pull --rebase` in the repo root to ensure the local branch is up to date.
3. Read `apps/mobile/package.json` to get the current `version`.

## Step 1: Gather changes since last release

1. Find the last release tag (both old `mobile@` and new `mobile/v` prefixes exist):
   ```bash
   git tag --sort=-creatordate | grep -E '^mobile[@/]' | head -1
   ```
2. If no tag found, find the last release commit by matching only the subject line:
   ```bash
   git log --format="%H %s" | grep "^[a-f0-9]* release(mobile): release v" | head -1 | awk '{print $1}'
   ```
3. Get all commits since the last release on the current branch:
   ```bash
   git log <last-tag-or-commit>..HEAD --oneline --no-merges
   ```
4. Categorize commits into:
   - **Shiny new things** (feat: commits, new features)
   - **Improvements** (refactor:, perf:, chore: improvements, dependency updates)
   - **No longer broken** (fix: commits, bug fixes)
   - **Thanks** (identify external contributor GitHub usernames from commits)

## Step 2: Update changelog

1. Read `apps/mobile/changelog/next.md`.
2. Present the categorized changes to the user and draft the changelog content.
3. Wait for user confirmation or edits before writing.
4. Write the final content to `apps/mobile/changelog/next.md`, following the template format:

   ```markdown
   # What's New in vNEXT_VERSION

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

## Step 3: Execute bump

1. Change directory to `apps/mobile/` and run the bump:
   ```bash
   cd apps/mobile && pnpm bump
   ```
2. This is an interactive `nbump` command that prompts for version selection. It will:
   - Pull latest changes
   - Apply changelog (rename next.md to {version}.md, create new next.md from template)
   - Format package.json with eslint + prettier
   - Bump version in `package.json`
   - Update `ios/Folo/Info.plist`:
     - Set `CFBundleShortVersionString` to the new version
     - Increment `CFBundleVersion` (build number) by 1
   - Commit with message `release(mobile): release v{NEW_VERSION}`
   - Create branch `release/mobile/{NEW_VERSION}`
   - Push branch and create PR to `mobile-main`

## Step 4: Verify

1. Confirm the PR was created successfully by checking the output.
2. Report the new version number and PR URL to the user.
3. Summarize:
   - New version: v{NEW_VERSION}
   - Changelog highlights
   - PR URL

## Post-release (manual steps, inform user)

After the release PR is merged to `mobile-main`:

1. **Trigger production builds** via GitHub Actions `workflow_dispatch`:
   - Go to "Build iOS" workflow, select `mobile-main` branch, profile = `production`
   - Go to "Build Android" workflow, select `mobile-main` branch, profile = `production`
2. Production builds auto-submit to App Store (via `eas submit`) and Google Play (as draft).
3. After submission, go to App Store Connect and Google Play Console to complete the review/release process.

## Reference

- Bump config: `apps/mobile/bump.config.ts`
- Changelog dir: `apps/mobile/changelog/`
- Changelog template: `apps/mobile/changelog/next.template.md`
- Apply changelog script: `apps/mobile/scripts/apply-changelog.ts`
- EAS config: `apps/mobile/eas.json`
- App config: `apps/mobile/app.config.ts`
- iOS Info.plist: `apps/mobile/ios/Folo/Info.plist`
- CI build iOS: `.github/workflows/build-ios.yml`
- CI build Android: `.github/workflows/build-android.yml`
