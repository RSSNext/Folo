---
name: mobile-release
description: Use when preparing a mobile release from the dev branch and deciding whether changes should ship through the app stores or through the OTA pipeline before creating the release PR to mobile-main.
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Mobile Release

Perform a mobile release from `dev`, with an explicit release-mode decision before the bump.

The skill must recommend one of these modes, explain why, ask the user to confirm, and then write `apps/mobile/release-plan.json` before running the bump:

- `store`: normal App Store / Google Play release
- `ota`: OTA-only publish, no store builds
- `store-policy`: metadata-only publish for `/policy`, no store builds

The CI release flow is file-driven:

- `apps/mobile/release-plan.json` is the editable plan on `dev`
- `pnpm bump` runs `apps/mobile/scripts/apply-release-config.ts`
- that script writes `apps/mobile/release.json` for the new version and resets the plan back to a safe default
- GitHub Actions reads `apps/mobile/release.json` after merge to decide which pipelines to trigger

## Pre-flight checks

1. Confirm the current branch is `dev`. If not, abort with a warning.
2. Run `git pull --rebase` in the repo root.
3. Read:
   - `apps/mobile/package.json`
   - `apps/mobile/release-plan.json`
   - `.github/workflows/tag.yml`
   - `.github/workflows/publish-ota.yml`

## Step 1: Gather changes since last release

1. Find the last mobile tag:
   ```bash
   git tag --sort=-creatordate | grep -E '^mobile[@/]' | head -1
   ```
2. If no tag exists, fall back to the last release commit subject:
   ```bash
   git log --format="%H %s" | grep -Ei "^[a-f0-9]* release\\(mobile\\): release v" | head -1 | awk '{print $1}'
   ```
3. Collect commits since that point:
   ```bash
   git log <last-tag-or-commit>..HEAD --oneline --no-merges
   ```
4. Collect changed files:
   ```bash
   git diff --name-only <last-tag-or-commit>..HEAD
   ```
5. Categorize commits into:
   - `Shiny new things`
   - `Improvements`
   - `No longer broken`
   - `Thanks`

## Step 2: Recommend a release mode

### Recommend `store` when:

- any native or binary-affecting paths changed, for example:
  - `apps/mobile/ios/**`
  - `apps/mobile/android/**`
  - `apps/mobile/native/**`
  - `apps/mobile/package.json`
  - `apps/mobile/app.config.ts`
  - `apps/mobile/app.config.base.ts`
  - `apps/mobile/eas.json`
  - `apps/mobile/ios/Folo/Info.plist`
  - `.github/workflows/build-ios.yml`
  - `.github/workflows/build-android.yml`
- Expo / React Native / native dependency changes require a new binary
- permissions, entitlements, icons, splash, Firebase config, or build configuration changed

### Recommend `ota` when:

- changes are limited to JS/TS/assets that the current binary can already run
- no native or runtime-affecting paths changed
- the goal is to ship without store review

### Recommend `store-policy` only when:

- the user explicitly wants `/policy` to prompt or block older binaries
- no new store binary should be built

Do not recommend `store-policy` by default for ordinary releases.

### Determine the target runtime

If recommending `ota` or `store-policy`, derive the target store binary version from recent `origin/mobile-main` releases and propose it as the `runtimeVersion`.

If you cannot determine the runtime confidently, stop and ask the user to confirm it.

### Confirmation gate

Present:

- the recommended mode
- rationale based on changed files and commits
- for `ota` or `store-policy`, the proposed `runtimeVersion`
- for `ota` or `store-policy`, the proposed `channel`
- for `store-policy`, whether `/policy` should block (`storeRequired=true`) or just prompt (`storeRequired=false`)

Wait for explicit user confirmation before continuing.

## Step 3: Write the release plan file

Update `apps/mobile/release-plan.json` to match the confirmed mode.

Examples:

### Store release

```json
{
  "mode": "store",
  "runtimeVersion": null,
  "channel": null,
  "storeRequired": false,
  "message": null
}
```

### OTA release

```json
{
  "mode": "ota",
  "runtimeVersion": "0.4.1",
  "channel": "production",
  "storeRequired": false,
  "message": null
}
```

### Store policy release

```json
{
  "mode": "store-policy",
  "runtimeVersion": "0.4.3",
  "channel": "production",
  "storeRequired": true,
  "message": "Install 0.4.3 from the store."
}
```

## Step 4: Update changelog

1. Read `apps/mobile/changelog/next.md`.
2. Present the categorized changes and draft changelog content.
3. Wait for user confirmation or edits before writing.
4. Write the final content to `apps/mobile/changelog/next.md`.

## Step 5: Commit pre-bump files before bump

`nbump` requires a clean working tree.

1. Stage:
   ```bash
   git add apps/mobile/changelog/next.md apps/mobile/release-plan.json
   ```
2. Commit:
   ```bash
   git commit -m "docs(mobile): prepare release metadata"
   ```
3. If nothing changed, continue.

## Step 6: Execute bump

1. Verify the working tree is clean:
   ```bash
   git status --short
   ```
2. Run:
   ```bash
   cd apps/mobile && pnpm bump
   ```
3. `pnpm bump` will:
   - apply changelog
   - bump `package.json`
   - update `ios/Folo/Info.plist`
   - run `tsx scripts/apply-release-config.ts ${NEW_VERSION}`
   - write `apps/mobile/release.json`
   - reset `apps/mobile/release-plan.json` back to the safe default `store`
   - create the release branch
   - push the branch
   - open a PR to `mobile-main`

## Step 7: Verify and report

1. Confirm the PR was created successfully.
2. Read `apps/mobile/release.json` on the release branch and report:
   - new version
   - final release mode
   - runtimeVersion and channel if present
   - storeRequired and message for `store-policy`
   - PR URL
3. Summarize expected post-merge automation:

### `mode=store`

- create mobile tag
- trigger preview Android build
- trigger production Android build
- trigger production iOS build
- no OTA publish

### `mode=ota`

- create mobile tag
- trigger OTA publish only
- no store builds

### `mode=store-policy`

- create mobile tag
- trigger metadata-only OTA publish
- no store builds

## References

- Bump config: `apps/mobile/bump.config.ts`
- Release plan: `apps/mobile/release-plan.json`
- Release config: `apps/mobile/release.json`
- Apply release config script: `apps/mobile/scripts/apply-release-config.ts`
- Changelog dir: `apps/mobile/changelog/`
- Apply changelog script: `apps/mobile/scripts/apply-changelog.ts`
- Release config resolver: `.github/scripts/resolve-mobile-release-config.mjs`
- Tag orchestration: `.github/workflows/tag.yml`
- OTA publish workflow: `.github/workflows/publish-ota.yml`
- App config: `apps/mobile/app.config.ts`
- iOS Info.plist: `apps/mobile/ios/Folo/Info.plist`
