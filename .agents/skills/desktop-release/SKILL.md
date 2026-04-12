---
name: desktop-release
description: Perform a regular desktop release from the dev branch. Gather changes since the last desktop tag, update the changelog, choose the desktop release mode in release-plan.json, bump the version, and prepare the release PR.
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Desktop Regular Release

Perform a regular desktop release from the `dev` branch.

This workflow is now file-driven:

- `apps/desktop/changelog/next.md` is the human-edited changelog draft.
- `apps/desktop/release-plan.json` is the human-edited release intent.
- `pnpm --dir apps/desktop bump` applies both inputs, writes `apps/desktop/release.json`, resets `apps/desktop/release-plan.json`, bumps the version, creates `release/desktop/{NEW_VERSION}`, pushes it, and opens the PR.

Important notes:

- `mainHash` is still regenerated automatically, but it is **not** the OTA compatibility switch anymore. Do not use it as the release decision point.
- `runtimeVersion` in `apps/desktop/package.json` is the desktop OTA compatibility key. `apps/desktop/scripts/apply-release-config.impl.ts` writes it during bump.
- This skill covers the normal `build` and `ota` desktop release flow.
- `binary-policy` exists in `apps/desktop/release-plan.json`, and the current `tag.yml` automation dispatches a standalone desktop metadata-only publish path.

## Pre-flight checks

1. Confirm the current branch is `dev`. If not, abort with a warning.
2. Run `git pull --rebase` in the repo root to ensure the local branch is up to date.
3. Read:
   - `apps/desktop/package.json`
   - `apps/desktop/release-plan.json`
   - `apps/desktop/release.json`
   - `apps/desktop/bump.config.ts`
4. Record the current:
   - `version`
   - `runtimeVersion`
   - `release-plan.json` contents
5. Note that `pnpm --dir apps/desktop bump` will push a branch and open a PR. Do not run it without explicit user approval.

## Step 1: Gather changes since last desktop release

1. Find the last desktop release tag:
   ```bash
   git tag --sort=-creatordate | grep '^desktop/v' | head -1
   ```
2. Get all commits since that tag on the current branch:
   ```bash
   git log <last-tag>..HEAD --oneline --no-merges
   ```
3. Categorize commits into:
   - **Shiny new things**
   - **Improvements**
   - **No longer broken**
   - **Thanks**

## Step 2: Update changelog draft

1. Read `apps/desktop/changelog/next.md`.
2. Draft the changelog content from the categorized commits.
3. Present the draft to the user.
4. Wait for user confirmation or edits before writing.
5. Write the final content to `apps/desktop/changelog/next.md` using the existing template structure.
6. Keep `NEXT_VERSION` as the placeholder. `apps/desktop/scripts/apply-changelog.ts` replaces it during bump.

## Step 3: Choose the desktop release mode

This replaces the old `mainHash` decision.

Inspect runtime-affecting changes since the last desktop tag:

```bash
git diff <last-tag>..HEAD --name-only -- \
  apps/desktop/layer/main/ \
  apps/desktop/layer/preload/ \
  apps/desktop/forge.config.cts \
  apps/desktop/resources/ \
  apps/desktop/scripts/ \
  apps/desktop/package.json
```

Use this decision table:

- `build`
  Use this when the release requires a new binary.
  Typical triggers:
  - main process changes
  - preload or IPC changes
  - updater flow changes
  - Electron / Forge / packaging / signing changes
  - native resource changes
  - dependency or package changes that affect runtime behavior

- `ota`
  Use this when the release is renderer-compatible with an already-installed binary.
  Typical triggers:
  - renderer UI changes
  - web behavior changes
  - shared frontend logic changes that do not require a new desktop binary

  For `ota`, you must choose:
  - `runtimeVersion`: the newest installed desktop binary version that this renderer update is compatible with
  - `channel`: usually `stable`
  - `distributions`: any desktop distributions that should receive policy metadata alongside the OTA release

  If you are unsure whether a change is binary-compatible, prefer `build`.

- `binary-policy`
  Metadata-only policy release.
  Use this when the release should update desktop binary policy metadata without rebuilding installers.

Present the analysis to the user with:

- changed runtime-affecting files
- summary of what changed
- recommended mode: `build` or `ota`
- recommended `release-plan.json`
- explicit request for confirmation

## Step 4: Update release inputs

1. Edit `apps/desktop/changelog/next.md`.
2. Edit `apps/desktop/release-plan.json`.
3. Do **not** edit `apps/desktop/release.json` directly. It is generated during bump.
4. Because `nbump` requires a clean working tree, commit the release inputs before bump.

Stage the inputs:

```bash
git add apps/desktop/changelog/next.md apps/desktop/release-plan.json
```

Commit them on `dev`:

```bash
git commit -m "docs(desktop): prepare release inputs"
```

If there are no changes to commit, continue.

## Step 5: Run the bump

Do not execute this step until the user explicitly approves pushing code.

Run:

```bash
pnpm --dir apps/desktop bump
```

This command currently does all of the following:

- pulls latest changes
- applies the changelog
- regenerates `mainHash`
- runs `apps/desktop/scripts/apply-release-config.ts ${NEW_VERSION}`
- writes `apps/desktop/release.json`
- updates `apps/desktop/package.json` `runtimeVersion`
- resets `apps/desktop/release-plan.json` back to the default `build` template
- commits `release(desktop): release v{NEW_VERSION}`
- creates `release/desktop/{NEW_VERSION}`
- pushes the branch
- creates a PR to `main`

## Step 6: Verify the generated release state

After bump completes, verify:

1. Current branch is `release/desktop/{NEW_VERSION}`.
2. `apps/desktop/package.json` has the expected:
   - `version`
   - `runtimeVersion`
3. `apps/desktop/release.json` matches the intended mode and release settings.
4. `apps/desktop/release-plan.json` was reset to the default template.
5. The PR was created successfully.

Also note what will happen after merge:

- merging the PR to `main` triggers `.github/workflows/tag.yml`
- `tag.yml` creates `desktop/v{NEW_VERSION}`
- `tag.yml` dispatches `.github/workflows/build-desktop.yml`
- `build-desktop.yml` publishes the desktop release draft

Expected release artifacts by mode:

- `build`
  publishes binary artifacts and desktop binary metadata (`ota-release.json`)

- `ota`
  publishes binary artifacts, desktop binary metadata, and renderer OTA assets such as:
  - `apps/desktop/dist/manifest.yml`
  - `apps/desktop/dist/*.tar.gz`
  - `apps/desktop/dist/ota-release.json`
  - `apps/desktop/dist.tar.zst`

## Step 7: Report back to the user

Summarize:

- new version: `v{NEW_VERSION}`
- release mode: `build` or `ota`
- `runtimeVersion`
- renderer OTA included: yes or no
- release branch
- PR URL
- short changelog highlights

When mentioning `mainHash`, only describe it as "regenerated automatically", never as the release decision mechanism.

## Reference

- Bump config: `apps/desktop/bump.config.ts`
- Changelog dir: `apps/desktop/changelog/`
- Changelog template: `apps/desktop/changelog/next.template.md`
- Changelog apply script: `apps/desktop/scripts/apply-changelog.ts`
- Release plan input: `apps/desktop/release-plan.json`
- Generated release config: `apps/desktop/release.json`
- Release config apply script: `apps/desktop/scripts/apply-release-config.impl.ts`
- Desktop release config resolver: `.github/scripts/resolve-desktop-release-config.mjs`
- Desktop OTA metadata builder: `.github/scripts/build-ota-release.mjs`
- Desktop build workflow: `.github/workflows/build-desktop.yml`
- Tag orchestrator: `.github/workflows/tag.yml`
- Desktop hot updater: `apps/desktop/layer/main/src/updater/hot-updater.ts`
