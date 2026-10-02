---
name: mobile-release
description: Full Folo mobile release from dev to the stores. Decides between a store release and an OTA-only release, drafts the changelog, bumps the version and opens the release PR to mobile-main, verifies the PR's CI-built Android package and the iOS build on a simulator along with every change in the release, merges the PR, watches the build or OTA workflows, publishes the GitHub release, submits the iOS build for App Store review and the Android build for Google Play review, and drafts the announcement post and promo video. Use when the user asks to release, ship or publish the mobile app.
disable-model-invocation: true
argument-hint: "[optional notes, e.g. 'ota' or 'minor bump']"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Mobile Release

The release flow shared by every agent. Claude Code reaches it through `.claude/skills/mobile-release/SKILL.md`, which maps these steps onto Claude's tools. Change the flow here, not in the adapter.

Phase A prepares the release, Phase B verifies the packages GitHub Actions builds for the PR, and Phase C merges, carries the release through every store and drafts its announcement. The run ends only when every item in **Definition of done** for the chosen mode is checked, or when the only open items are blocked on the user and you have told them exactly what is left.

## Standing authorization

Invoking this skill is the user's approval, for this release, to:

- push `dev` and the release branch and open the release PR, once the Phase A confirmation gate passes
- merge the release PR after verification passes
- publish the GitHub release
- sign in to App Store Connect and Google Play Console with the user's 1Password logins through the password manager's browser autofill, without asking in chat
- fill What's New and release notes, submit the iOS version for App Review, and send the Google Play production release for review

Still ask first: code changes that fix something found during verification; accepting agreements, terms or policy declarations in any console; changing listings (beyond What's New and release notes), screenshots, pricing, availability, content rating or Data safety; deleting builds, releases, tracks or tags; force pushes; anything outside this release.

1Password still shows its own consent prompt on the user's devices. Request credentials only when a sign-in page actually shows up, and keep working on other steps while it waits.

Signed-in checks use the demo account (1Password item `mczvztynp5if7izw5wvmoggtru`) on QA devices that keep its session (`references/verify-android-build.md`, `references/verify-ios-build.md`). Never use the user's own account and never register new accounts on production.

## Definition of done

Store mode (`mode: store`):

- [ ] Release PR `release(mobile): Release v<version>` merged into `mobile-main` with a merge commit; tag `mobile/v<version>` exists
- [ ] GitHub release `Mobile v<version>` published with `build.apk`: not a draft, not a prerelease, not latest
- [ ] iOS: App Store version with the new build attached, What's New in every locale, state `WAITING_FOR_REVIEW`
- [ ] Android: Google Play production release with the new app bundle and release notes, sent for review
- [ ] `chore(sync): merge mobile-main into dev` merged, or its blocker reported
- [ ] Verification report and final summary delivered; temporary devices, downloads and browser tabs cleaned up
- [ ] Announcement kit delivered: X post, reply with the release links, quote line and promo video (C9)

OTA mode (`mode: ota`):

- [ ] Release PR merged; tag `mobile/v<version>` exists
- [ ] `https://ota.folo.is/manifest` returns the new release for iOS and Android on the chosen runtime and channel, and the launch asset downloads
- [ ] A device running the store binary for that runtime picks up the update (Settings → About shows `OTA <new version>`)
- [ ] GitHub release `Mobile v<version>` with `ota-release.json`, `dist.tar.zst` and `build.apk`: not a draft, not a prerelease, not latest
- [ ] Sync PR merged or reported; report delivered; cleanup done
- [ ] Announcement kit delivered (C9)

## How to work

- Shell tools: `git`, `gh`, `pnpm`, `asc` (App Store Connect API; its keychain profile is already set up), `xcrun` (`simctl`), `adb`, `emulator`, `aapt2` and `apksigner` from the newest `~/Library/Android/sdk/build-tools/*`, `axe` for simulator input, optionally `maestro`.
- Scratch space: `SCRATCH=<a temporary directory>/mobile-release-<version>`. Keep downloads, screenshots and `verification.md` there.
- Long waits (CI runs of 30–50 minutes, App Store processing): run `gh run watch <run-id> --exit-status --interval 60`, or a polling loop with `sleep`, as a background command and do the next independent step meanwhile.
- Store consoles run in the user's Chrome, which holds the store sessions and the 1Password integration. Read `references/browser-and-credentials.md` before the first browser step.
- Simulators and emulators follow the isolation rules of `.agents/skills/mobile-self-test`: never take over one another session is driving. iOS is verified on simulators only, never on the user's physical devices.
- Talk to the user in their language. Everything written into the repository stays English.
- If a desktop release runs in the same session, take turns in Chrome, one console at a time.

## Phase A: Prepare the release

### A0. Pre-flight

1. Pick the checkout. `dev` can be checked out in only one worktree at a time:
   ```bash
   git fetch origin --prune --tags
   git worktree list --porcelain | grep -B2 '^branch refs/heads/dev$' || echo "dev is free"
   git status --short
   ```
   If another worktree has `dev`, stop and ask which checkout to use. Otherwise, with a clean tree (nbump counts untracked files as dirty too), `git switch dev` (or `git switch -c dev --track origin/dev`), then `git pull --rebase`. Check `git log --oneline origin/dev..dev`: local commits that are not on `origin/dev` would ship in this release and be pushed, so list them at the gate and let the user decide; never reset or rewrite `dev` on your own.
2. The previous release must already be merged back: `git merge-base --is-ancestor origin/mobile-main origin/dev`. If that fails, the last `chore(sync): merge mobile-main into dev` PR has not landed (`gh pr list --base dev --head mobile-main --state open`), and bumping now would compute the wrong version. Stop and report.
3. Read `apps/mobile/package.json`, `apps/mobile/release-plan.json`, `.github/workflows/tag.yml` and `.github/workflows/publish-ota.yml`.
4. Tooling: `gh auth status`; `asc auth status` lists a keychain credential; the browser tool reaches the user's Chrome; `xcrun simctl list devices`; `adb devices`; `df -h /System/Volumes/Data` has several GB free.
5. Store snapshot (read only):
   ```bash
   curl -fsS https://ota.folo.is/versions | jq '{store: .store.mobile, github: .github.mobile}'
   asc versions list --app 6739802604 --platform IOS --limit 3 --output json 2>/dev/null \
     | jq -r '.data[] | [.id, .attributes.versionString, (.attributes.appVersionState // .attributes.appStoreState)] | @tsv'
   ```
   Note any editable iOS version and whether its version string will need renaming. A version still `WAITING_FOR_REVIEW` or `IN_REVIEW` blocks a new submission; mention it at the gate.

The bump (A5) pushes a branch and opens a PR. Never run it before the confirmation gate passes.

### A1. Gather changes

1. Last mobile tag: `git tag --sort=-creatordate | grep -E '^mobile[@/]' | head -1`. Without a tag, fall back to the last release commit: `git log --format="%H %s" | grep -Ei "^[a-f0-9]* release\(mobile\): release v" | head -1 | awk '{print $1}'`.
2. Commits and changed files since then: `git log <ref>..HEAD --oneline --no-merges`, `git diff --name-only <ref>..HEAD`. Keep what affects mobile (`apps/mobile/**`, `packages/**`, `locales/**`, root dependency files); desktop-only commits do not belong in this changelog.
3. Categorize into **Shiny new things**, **Improvements**, **No longer broken** and **Thanks**.

### A2. Recommend a release mode

Only `store` and `ota` exist; never write another mode.

Recommend `store` when any native or binary-affecting path changed, for example `apps/mobile/ios/**`, `apps/mobile/android/**`, `apps/mobile/native/**`, `apps/mobile/package.json`, `apps/mobile/app.config.base.ts`, `apps/mobile/app.config.js`, `apps/mobile/plugins/**`, `apps/mobile/eas.json`, `apps/mobile/ios/Folo/Info.plist`, `.github/workflows/build-ios.yml`, `.github/workflows/build-android.yml`; when Expo, React Native or native dependencies changed; or when permissions, entitlements, icons, splash, Firebase config or build configuration changed.

Also recommend `store` when the entry HTML renderer changed: `apps/mobile/web-app/**` is built into `out/rn-web` and shipped inside the binary (iOS resources, Android `html-renderer` assets), so an OTA cannot update it, while the PR's preview builds would still show the change. That includes changes in the packages it bundles (`packages/internal/{components,hooks,shared,types,utils}`, `packages/configs`) when the renderer uses the changed files, and `apps/mobile/code-signing/**`, whose certificate is embedded in the binary.

Recommend `ota` when the changes are limited to JS, TS and assets the current binary can already run, nothing native changed, and the goal is to ship without store review.

For `ota`, derive the runtime from the store binaries users have installed, not from the new version, the latest tag or the latest OTA release:

1. `curl -fsS https://ota.folo.is/versions | jq '.store.mobile'`.
2. Cross-check `apps/mobile/app.config.base.ts`: the runtime defaults to the binary's package version unless `OTA_RUNTIME_VERSION` is set during an OTA export.
3. Use the current App Store and Google Play binary version as `runtimeVersion`. If the stores show `0.5.0`, an OTA for `0.5.4` uses `"runtimeVersion": "0.5.0"`.
4. If iOS and Android differ, or the installed runtime is unclear, stop and ask. The plan supports one runtime; never guess or silently pick the newest.

Never choose the previous OTA release version just because it is the latest working manifest; a runtime mismatch publishes assets only newer binaries can see and leaves store users stuck.

Plans:

```json
{ "mode": "store", "runtimeVersion": null, "channel": null }
```

```json
{ "mode": "ota", "runtimeVersion": "0.5.10", "channel": "production" }
```

### A3. Draft the changelog

Read `apps/mobile/changelog/next.md` (template: `next.template.md`) and draft it from the categorized commits, one user-facing line per change. Keep `NEXT_VERSION` as the placeholder.

### A4. Confirmation gate

Show the user, in one message:

- the next version: a patch bump by default (`--patch`, e.g. 0.5.10 → 0.5.11); mobile versions stay within 0.5.x even for feature releases unless the user asks for `--minor`
- the recommended mode with the rationale from files and commits; for `ota`, the runtime and channel and how they were derived; the exact `release-plan.json`
- the changelog draft
- what happens after a "go" without further questions (Phases B and C) and what may still need them

The store release notes are fixed text (`references/release-notes.md`), so they need no review. Wait for an explicit go-ahead. Apply edits; ask again only if the version or the mode changes.

### A5. Write the inputs and bump

1. Write `apps/mobile/release-plan.json` and `apps/mobile/changelog/next.md`.
2. Commit on `dev`; nbump needs a clean tree. Skip the commit if nothing changed:
   ```bash
   git add apps/mobile/changelog/next.md apps/mobile/release-plan.json
   git commit -m "docs(mobile): prepare release metadata"
   ```
3. Bump from inside `apps/mobile` with an explicit type (plain `vv` shows a version menu), then push `dev`:
   ```bash
   git status --short                                   # must be empty
   (cd apps/mobile && echo y | pnpm bump --patch)       # or --minor; answers nbump's "Continue?" prompt
   git rev-parse --abbrev-ref HEAD                      # must print release/mobile/<version>
   gh pr view --json number,url,title                   # must show the new PR
   git push origin dev                                  # only after both checks pass
   ```
   nbump looks for `package.json` from `INIT_CWD`, the directory pnpm was started in, so `pnpm --dir apps/mobile bump` from the repository root reads the root `package.json` and fails. It also asks "Continue?" after printing the versions; with no input the prompt aborts and the command still exits 0, so check the branch and the PR before pushing anything.
   The bump applies the changelog, bumps `package.json`, sets `CFBundleShortVersionString` and increments `CFBundleVersion` in `ios/Folo/Info.plist`, runs `scripts/apply-release-config.ts` (writes `release.json`, resets `release-plan.json` to `store`), commits `release(mobile): release v<version>` with `--no-verify` on a new `release/mobile/<version>` branch, pushes it and opens a PR to `mobile-main` titled `release(mobile): Release v<version>`. Only the metadata commit in step 2 goes through the lint-staged hook; if that hook fails, fix the cause and commit again.
4. Record `VERSION`, `MODE` and `PR` (`gh pr view --json number,url`).

### A6. Check the generated state

On `release/mobile/<version>`: `apps/mobile/release.json` has the version, mode, runtime and channel; `release-plan.json` is back to `store`; `package.json` and `ios/Folo/Info.plist` carry the new version; the PR exists against `mobile-main`.

## Phase B: Verify the PR builds

Never merge with an open blocker: a store build or an OTA publish starts as soon as the PR is merged.

### B1. Wait for CI

The push to `release/mobile/<version>` starts:

- `🍎 Build iOS` (preview profile): an ad-hoc signed `build.ipa` in the artifact `app-ios`; about 40 minutes on GitHub's macOS runners with Xcode 26.4.1.
- `🤖 Build Android` (preview profile): `build.apk` in the artifact `app-android`; about 40 minutes.
- `📱 Build iOS for development` (development clients; not needed here).

```bash
HEAD_SHA=$(git rev-parse HEAD)
for wf in build-ios.yml build-android.yml; do
  gh run list --workflow "$wf" --branch "release/mobile/$VERSION" --event push \
    --json databaseId,headSha --jq ".[] | select(.headSha == \"$HEAD_SHA\") | .databaseId"
done
```

Watch both runs and `gh pr checks "$PR" --watch --interval 60` in the background. A new push to the branch cancels running builds. If a job fails, read `gh run view <run-id> --log-failed`; rerun once for infrastructure flakes, otherwise stop and report.

Write the verification plan (B2) and start the iOS simulator build (`references/verify-ios-build.md` §2) while the runs go.

### B2. Write the verification plan

Create `$SCRATCH/verification.md` with one row per item: what to check, platform (iOS, Android or both), account state (signed in or guest), expected result, evidence file, result.

- Every changelog entry, on both platforms unless it is platform specific.
- Every risky commit, even one without an entry: native modules, the iOS and Android projects, player and TTS, auth, sync engine, OTA client, networking.
- The smoke suite: launch to the timeline without an error; open an entry; the player bar if audio is involved; each Settings tab; switch the app language and back; Discover; Settings → About shows `<version> (<build>)`; no crash in the logs.
- `ota` mode: the JS must also run on the old binary. Check that nothing native changed since the runtime's tag. Every bump touches `Info.plist` and `package.json`, so those two are inspected by content:
  ```bash
  git diff mobile/v<runtimeVersion>..HEAD --name-only -- apps/mobile/ios apps/mobile/android apps/mobile/native \
    apps/mobile/plugins apps/mobile/web-app apps/mobile/code-signing apps/mobile/app.config.base.ts \
    apps/mobile/app.config.js apps/mobile/eas.json ':(exclude)apps/mobile/ios/Folo/Info.plist'
  git diff mobile/v<runtimeVersion>..HEAD -U0 -- apps/mobile/package.json apps/mobile/ios/Folo/Info.plist
  ```
  The first command must print nothing, and the second may only change `version`, `CFBundleShortVersionString` and `CFBundleVersion`. Also look at `pnpm-lock.yaml` for dependencies with native code. Any other hit means the mode is wrong: stop and go back to the gate. The real old-binary check happens after publishing (C4).

### B3. Verify the Android package

Follow `references/verify-android-build.md`: download `app-android`, check package, version and signing certificate, install it on the QA emulator (a temporary emulator as a guest fallback), work through the plan, and clean up.

### B4. Verify the iOS build

Follow `references/verify-ios-build.md`: download `app-ios` and check the IPA statically, then run the functional checks on a simulator with a Release build of the same commit. The ad-hoc IPA itself runs only on registered physical devices, which are not used for verification.

### B5. Decide

- Pass: every item passed or carries a non-blocking note, and the PR checks are green.
- Blocking: a crash, a wrong version, bundle ID, profile or signing certificate, a changelog item that does not work, a regression in a core flow, red PR checks.

On a blocker, stop and tell the user with the evidence and a proposed fix. A fix lands on `dev` first and is then cherry-picked onto `release/mobile/<version>`. Committing `apps/mobile/src` changes on a `release/*` branch runs `scripts/increment-build-id.sh`, which raises `CFBundleVersion` in `ios/Folo/Info.plist`; that is harmless, since EAS sets the build numbers remotely (`appVersionSource: remote`). A local simulator build can also raise `CFBundleVersion`; check `git status` before committing so it does not slip in. The push rebuilds the packages and B1–B5 run again.

## Phase C: Merge and ship

### C1. Merge

```bash
gh pr view "$PR" --json state,mergeable,mergeStateStatus --jq .
gh pr merge "$PR" --merge
MERGE_SHA=$(gh pr view "$PR" --json mergeCommit --jq .mergeCommit.oid)
```

Use a merge commit: the default merge message puts the PR title in the body, and `tag.yml` reads it from there. No `--admin`, no squash or rebase.

### C2. Watch the post-merge workflows

`🏷️ Release Orchestrator` (`tag.yml`) runs for `MERGE_SHA`, creates `mobile/v<version>`, resolves `apps/mobile/release.json` and dispatches:

- store mode, on `mobile-main`:
  - `🤖 Build Android` with `production-apk` and `release=true`: builds the APK and creates the GitHub release `Mobile v<version>` as a draft prerelease with `build.apk` (about 35 minutes; artifact `app-android`)
  - `🤖 Build Android` with `production`: builds the AAB and runs `eas submit`, which uploads it to Google Play as a draft release on the internal testing track (about 30 minutes; artifact `aab-android`)
  - `🍎 Build iOS` with `production`: builds the IPA and runs `eas submit`, which uploads it to App Store Connect; EAS raises the build number remotely (about 50 minutes)
- ota mode: `📡 Publish OTA Release` on the tag (exports the bundle, attaches `ota-release.json` and `dist.tar.zst` to the release, triggers the worker sync; a few minutes) and the `production-apk` Android build above

```bash
gh run list --workflow tag.yml --branch mobile-main --limit 3 --json databaseId,headSha,status,conclusion
for wf in build-android.yml build-ios.yml publish-ota.yml; do
  gh run list --workflow "$wf" --event workflow_dispatch --limit 3 --json databaseId,headBranch,createdAt,status
done
```

Tell the two Android runs apart by their artifacts or steps (`app-android` with "Create Release Draft" versus `aab-android` with "Submit to Google Play"). Watch every run in the background. The push-triggered builds on `mobile-main` are skipped on purpose. `🔄 Sync Release Branches To Dev` opens `chore(sync): merge mobile-main into dev` (C7).

### C3. Publish the GitHub release

Drafts are invisible to the tag endpoint, so find the release through the list API:

```bash
gh api repos/RSSNext/Folo/releases --jq ".[] | select(.tag_name == \"mobile/v$VERSION\") | {id, draft, prerelease, assets: [.assets[].name]}"
```

- Store mode: one draft with `build.apk`. Download it (`mkdir -p "$SCRATCH/release" && gh api repos/RSSNext/Folo/releases/assets/<asset id> -H 'Accept: application/octet-stream' > "$SCRATCH/release/build.apk"`) and check it as in `references/verify-android-build.md` §1: package `is.follow`, versionName the new version, the EAS signing certificate.
- OTA mode: `ota-release.json`, `dist.tar.zst` and `build.apk` should sit on one non-draft release (the APK build may have marked it prerelease). If they ended up on two releases with the same tag, stop and report.

Then publish it without taking "latest" away from the desktop release, and check:

```bash
LATEST_BEFORE=$(gh api repos/RSSNext/Folo/releases/latest --jq .tag_name)    # a desktop/v… tag
gh api -X PATCH "repos/RSSNext/Folo/releases/<release id>" -F draft=false -F prerelease=false -f make_latest=false
gh release view "mobile/v$VERSION" --json isDraft,isPrerelease                 # both false
gh api repos/RSSNext/Folo/releases/latest --jq .tag_name                       # still a desktop/v… tag
```

`gh release view` has no `isLatest` field; the `releases/latest` endpoint is the check. In OTA mode `publish-ota.yml` creates the release without `--latest=false`, so a mobile tag may already hold "latest" before you start. If `LATEST_BEFORE` or the final check shows a `mobile/v…` tag, give it back to the newest desktop release with `gh release edit desktop/v<newest> --latest` and mention it in the report.

### C4. Check OTA delivery and download links

Store mode, within about 15 minutes of C3:

```bash
curl -fsS https://ota.folo.is/versions | jq '.github.mobile'
curl -sI https://ota.folo.is/download/mobile/android/apk | grep -i '^location'
```

OTA mode, after the publish run:

```bash
for p in ios android; do
  curl -fsS -H "expo-platform: $p" -H "expo-runtime-version: <runtimeVersion>" -H "expo-channel-name: <channel>" \
    "https://ota.folo.is/manifest?product=mobile" | jq -r '.metadata.releaseVersion, .launchAsset.url'
done
```

Both platforms must report the new version, and the launch asset URL must download. Then check a real old binary: install the GitHub release APK of version `<runtimeVersion>` on a temporary emulator as a fresh install (`references/verify-android-build.md` §4), launch it, wait for the update, relaunch, and confirm Settings → About shows `OTA <new version>` (before the update it shows `OTA <runtimeVersion>`, the runtime fallback) and the changed screens work. If it doesn't, follow the rollback checklist in `apps/ota/README.md` and tell the user at once.

### C5. App Store (store mode)

Follow `references/store-submissions.md` § App Store: confirm "Submit to App Store" succeeded in the iOS run, wait for processing, rename or create the iOS version, fill What's New in every locale, validate, submit with `asc`, and confirm `WAITING_FOR_REVIEW` with `asc` and in App Store Connect.

### C6. Google Play (store mode)

Follow `references/store-submissions.md` § Google Play: confirm "Submit to Google Play" succeeded, create the production release from the uploaded bundle in Play Console, add the release notes, and send the changes for review.

### C7. Sync PR

```bash
gh pr list --base dev --head mobile-main --state all --limit 1 \
  --json number,state,mergedAt,mergeStateStatus,autoMergeRequest
```

`dev` requires `Format, Lint and Typecheck (lts/*)` and `Build web and SSR server (lts/*)`. The PR is opened with the workflow token, which starts no `pull_request` workflows; since October 2026 `lint.yml` and `build-web.yml` also run on pushes to `mobile-main`, so the merge commit carries both checks and the sync PR auto-merges like the desktop one. A release whose `mobile-main` predates that change won't get them (#5095 waited eight days). Check `gh pr checks <n> --required`. Merged, or the required checks running: fine. Checks missing or failing, or conflicts: report it with the details and the fix (closing and reopening the PR starts the checks; conflicts need a manual merge), and don't push to `dev` or `mobile-main` to force it unless the user asks. The next release's pre-flight depends on it.

### C8. Report and clean up

Tell the user: version, mode, runtime and channel; PR and merge commit; tag; GitHub release URL; for store mode the App Store version state and the Google Play release state; for OTA mode the manifest results and the old-binary check; the sync PR; the verification summary with `verification.md` and the key screenshots; anything not verified and why. Store reviews finish later; say how to check them.

Clean up: delete temporary simulators and emulators, shut down QA devices you booted, delete downloads (keep the report and screenshots), revert stray changes such as `Info.plist` build numbers from local builds, close the browser tabs you opened, and release any granted credentials.

### C9. Announcement kit

Follow `.agents/skills/release-promo/SKILL.md`: pick the highlights, draft the X post, its reply with the release links and a one-sentence quote line for the second account, and render the promo video from the store captures. If a desktop release runs in the same session, make one kit for both after the later release's report. These are drafts; the user posts them.

## Failure handling

- The bump fails halfway: nbump restores `package.json` only when a trailing hook fails and rolls nothing back after a leading hook fails. Check `git status` and `git branch --list 'release/mobile/*'`, restore the tree with `git restore --staged --worktree apps/mobile` and delete the generated `apps/mobile/changelog/<version>.md` if the bump renamed `next.md`. Ask before deleting a leftover local release branch. If the branch reached GitHub but `gh pr create` failed, open the PR by hand with the title and body from `bump.config.ts`.
- A CI build or PR check fails: read the failed log, rerun once for flakes, otherwise stop before merging and report.
- Verification fails: stop before merging (B5).
- `tag.yml` fails or creates no tag: read its log. The usual causes are a merge message without the PR title or a `release.json` version mismatch. Report; never create release tags by hand.
- `eas submit` fails in a production run: read the log; rerun the failed job once for transient App Store Connect or Google Play errors (`gh run rerun <run-id> --failed`), otherwise report.
- App Store processing ends `INVALID` or `FAILED`: report with the build ID; App Store Connect emails the reason.
- The OTA manifest still serves the old release 15 minutes after the publish run: check the run's "Trigger OTA sync" step and report.
- A console asks to accept new agreements, terms or policy declarations: stop and ask; only the account holder can accept.
- A 1Password prompt times out: tell the user, continue with steps that don't need that login, retry once the user responds.
- Never delete releases, tags, builds, tracks or store releases to start over; ask first.

## Reference

- Claude Code adapter: `.claude/skills/mobile-release/SKILL.md`; device rules: `.agents/skills/mobile-self-test/SKILL.md`, `.agents/skills/mobile-e2e/SKILL.md`
- Bump config: `apps/mobile/bump.config.ts`
- Changelog: `apps/mobile/changelog/`, `apps/mobile/scripts/apply-changelog.ts`
- Release plan and config: `apps/mobile/release-plan.json`, `apps/mobile/release.json`, `apps/mobile/scripts/apply-release-config.ts`
- Release config resolver: `.github/scripts/resolve-mobile-release-config.mjs`
- Workflows: `.github/workflows/tag.yml`, `build-ios.yml`, `build-android.yml`, `publish-ota.yml`, `sync.yaml`, `lint.yml`, `build-web.yml`
- Build profiles and submit config: `apps/mobile/eas.json`; app config: `apps/mobile/app.config.base.ts`; iOS Info.plist: `apps/mobile/ios/Folo/Info.plist`
- OTA worker: `apps/ota` (its `README.md` lists manifest, policy and rollback steps)
- Announcement kit: `.agents/skills/release-promo/SKILL.md`; promo video renderer: `store-assets/scripts/release-video.ts`
- `references/verify-android-build.md`, `references/verify-ios-build.md`, `references/store-submissions.md`, `references/release-notes.md`, `references/browser-and-credentials.md`
