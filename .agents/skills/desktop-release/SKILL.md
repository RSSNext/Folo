---
name: desktop-release
description: Full Folo desktop release from dev to the stores. Drafts the changelog, picks the build or ota mode, bumps the version and opens the release PR, verifies the packages GitHub Actions builds for the PR and every change in the release, merges the PR, watches the tag and store builds, gets the Windows installer signed, publishes the GitHub release, submits the Mac App Store and Microsoft Store builds for review, and drafts the announcement post and promo video. Use when the user asks to release, ship or publish the desktop app.
disable-model-invocation: true
argument-hint: "[optional notes, e.g. a preferred mode or the OTA runtime]"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Desktop Release

The release flow shared by every agent. Claude Code reaches it through `.claude/skills/desktop-release/SKILL.md`, which maps these steps onto Claude's tools. Change the flow here, not in the adapter.

Phase A prepares the release, Phase B verifies the packages GitHub Actions builds for the PR, and Phase C merges, carries the release through every store and drafts its announcement. The run ends only when every item in **Definition of done** is checked, or when the only open items are blocked on the user and you have told them exactly what is left.

## Standing authorization

Invoking this skill is the user's approval, for this release, to:

- push `dev` and the release branch and open the release PR, once the Phase A confirmation gate passes
- merge the release PR after verification passes
- approve this release's SignPath signing request
- publish the GitHub release and mark it latest
- sign in to App Store Connect, Microsoft Partner Center and SignPath with the user's 1Password logins through the password manager's browser autofill, without asking in chat
- fill What's New, submit the Mac App Store version for review and the Microsoft Store submission for certification

Still ask first: code changes that fix something found during verification; accepting agreements or terms in any console; changing listings (beyond What's New), screenshots, pricing, availability or age ratings; deleting builds, releases, submissions or tags; force pushes; anything outside this release.

1Password still shows its own consent prompt on the user's devices. Request credentials only when a sign-in page actually shows up, and keep working on other steps while it waits.

## Definition of done

- [ ] Release PR `release(desktop): Release v<version>` merged into `main` with a merge commit; tag `desktop/v<version>` exists
- [ ] Windows installer signed through SignPath
- [ ] GitHub release `Desktop v<version>` has every asset, is not a prerelease and is marked latest
- [ ] `https://ota.folo.is` offers the new version (`/versions`, `/manifest`, `/download`)
- [ ] Mac App Store version: build attached, What's New in every locale, state `WAITING_FOR_REVIEW`
- [ ] Microsoft Store: new submission with `Folo.appx` `<version>.0` and What's New, submitted for certification
- [ ] `chore(sync): merge main into dev` merged, or its blocker reported
- [ ] Verification report and final summary delivered; temporary apps, profiles, mounts and browser tabs cleaned up
- [ ] Announcement kit delivered: X post, reply with the release links, quote line and promo video (C10)

## How to work

- Shell tools: `git`, `gh`, `pnpm`, `asc` (App Store Connect API; its keychain profile is already set up), `xcrun`/`codesign`/`spctl`/`hdiutil`, `agent-browser` (drives the Electron renderer over CDP), `node`.
- Scratch space: `SCRATCH=<a temporary directory>/desktop-release-<version>`. Keep downloads, screenshots and `verification.md` there.
- Long waits (CI runs, App Store processing): run `gh run watch <run-id> --exit-status --interval 60`, or a polling loop with `sleep`, as a background command and do the next independent step meanwhile.
- Store consoles run in the user's Chrome, which holds the store sessions and the 1Password integration. Read `references/browser-and-credentials.md` before the first browser step.
- Native macOS UI of the app under test (menus, dialogs, tray) needs a computer-use tool.
- Signed-in checks use the demo account (1Password item `mczvztynp5if7izw5wvmoggtru`) through a profile that already holds its session (`references/verify-macos-build.md`). Never use the user's own account and never register new accounts on production.
- Talk to the user in their language. Everything written into the repository stays English.
- If a mobile release runs in the same session, take turns in Chrome, one console at a time.

## Phase A: Prepare the release

### A0. Pre-flight

1. Pick the checkout. `dev` can be checked out in only one worktree at a time:
   ```bash
   git fetch origin --prune --tags
   git worktree list --porcelain | grep -B2 '^branch refs/heads/dev$' || echo "dev is free"
   git status --short
   ```
   If another worktree has `dev`, stop and ask which checkout to use. Otherwise, with a clean tree (nbump counts untracked files as dirty too), `git switch dev` (or `git switch -c dev --track origin/dev`), then `git pull --rebase`. Check `git log --oneline origin/dev..dev`: local commits that are not on `origin/dev` would ship in this release and be pushed, so list them at the gate and let the user decide; never reset or rewrite `dev` on your own.
2. The previous release must already be merged back: `git merge-base --is-ancestor origin/main origin/dev`. If that fails, the last `chore(sync): merge main into dev` PR has not landed (`gh pr list --base dev --head main --state open`), and bumping now would compute the wrong version. Stop and report.
3. Read `apps/desktop/package.json` (`version`, `runtimeVersion`), `apps/desktop/release-plan.json`, `apps/desktop/release.json` and `apps/desktop/bump.config.ts`.
4. Tooling: `gh auth status`; `asc auth status` lists a keychain credential; the browser tool reaches the user's Chrome; `agent-browser --version`; `df -h /System/Volumes/Data` has several GB free.
5. Store snapshot (read only):
   ```bash
   curl -fsS https://ota.folo.is/versions | jq '{store: .store.desktop, github: .github.desktop}'
   asc versions list --app 6739802604 --platform MAC_OS --limit 3 --output json 2>/dev/null \
     | jq -r '.data[] | [.id, .attributes.versionString, (.attributes.appVersionState // .attributes.appStoreState)] | @tsv'
   ```
   Note any editable macOS version (`PREPARE_FOR_SUBMISSION`, `*_REJECTED`) and whether its version string will need renaming. A version still `WAITING_FOR_REVIEW` or `IN_REVIEW` blocks a new submission; mention it at the gate.

The bump (A5) pushes a branch and opens a PR. Never run it before the confirmation gate passes.

### A1. Gather changes

1. Last desktop tag: `git tag --sort=-creatordate | grep '^desktop/v' | head -1`.
2. Commits since then: `git log <last-tag>..HEAD --oneline --no-merges`. Keep the ones that affect desktop (`apps/desktop/**`, `packages/**`, `locales/**`, root build and dependency files). Mobile-only commits do not belong in this changelog.
3. Categorize into **Shiny new things**, **Improvements**, **No longer broken** and **Thanks**.

### A2. Draft the changelog

1. Read `apps/desktop/changelog/next.md` (template: `next.template.md`).
2. Draft from the categorized commits: user-facing wording, one line per change.
3. Keep `NEXT_VERSION` as the placeholder; `apps/desktop/scripts/apply-changelog.ts` replaces it during the bump.

### A3. Choose the release mode

`mainHash` is regenerated automatically but is not the decision point. `runtimeVersion` in `apps/desktop/package.json` is the OTA compatibility key, written during the bump by `apps/desktop/scripts/apply-release-config.impl.ts`. Only `build` and `ota` exist; never write another mode.

```bash
git diff <last-tag>..HEAD --name-only -- \
  apps/desktop/layer/main/ apps/desktop/forge.config.cts apps/desktop/resources/ \
  apps/desktop/scripts/ apps/desktop/build/ apps/desktop/static/ apps/desktop/package.json \
  packages/internal/shared/ packages/internal/utils/ pnpm-lock.yaml
```

The preload lives in `apps/desktop/layer/main/preload/`. The main process imports `@follow/shared` and `@follow/utils`, so hits under `packages/internal/` need a look at whether main or preload code uses the changed files; `build/` (entitlements, appx template) and `static/` feed the packager.

- `build` needs a new binary: main process, preload or IPC, updater, Electron/Forge/packaging/signing, native resources, dependency changes with runtime effect. Plan: `{"mode": "build", "runtimeVersion": null, "channel": null}`.
- `ota` is for renderer-only changes an installed binary can run. Choose `runtimeVersion`, the newest installed binary this renderer is compatible with (`/versions` shows what the stores and GitHub serve now), and `channel`, usually `stable`.

When unsure whether a change is binary-compatible, choose `build`.

### A4. Confirmation gate

Show the user, in one message:

- the next version: the bump always bumps minor (`vv --minor`), e.g. 1.14.0 → 1.15.0
- the recommended mode, the runtime-affecting files and the reasoning, and the exact `release-plan.json`
- the changelog draft
- what happens after a "go" without further questions (Phases B and C) and what may still need them (1Password prompts on their devices, blocking verification failures, agreements)

The store release notes are fixed text (`references/release-notes.md`), so they need no review. Wait for an explicit go-ahead. Apply edits; ask again only if the version or the mode changes.

### A5. Write the inputs and bump

1. Write `apps/desktop/changelog/next.md` and `apps/desktop/release-plan.json`. Never edit `release.json` by hand.
2. Commit on `dev`; nbump needs a clean tree. Skip the commit if nothing changed:
   ```bash
   git add apps/desktop/changelog/next.md apps/desktop/release-plan.json
   git commit -m "docs(desktop): prepare release inputs"
   ```
3. Bump from inside `apps/desktop`, then push `dev` so it keeps the inputs commit the release branch is based on:
   ```bash
   (cd apps/desktop && echo y | pnpm bump)    # `vv --minor`; answers nbump's "Continue?" prompt
   git rev-parse --abbrev-ref HEAD             # must print release/desktop/<version>
   gh pr view --json number,url,title          # must show the new PR
   git push origin dev                         # only after both checks pass
   ```
   nbump looks for `package.json` from `INIT_CWD`, the directory pnpm was started in, so `pnpm --dir apps/desktop bump` from the repository root reads the root `package.json` and fails. It also asks "Continue?" after printing the versions; with no input the prompt aborts and the command still exits 0, so check the branch and the PR before pushing anything.
   The bump pulls, applies the changelog (`next.md` becomes `<version>.md`, a fresh `next.md` is copied from the template), regenerates `mainHash`, writes `release.json` and `runtimeVersion`, resets `release-plan.json` to the `build` template, commits `release(desktop): release v<version>` with `--no-verify` on a new `release/desktop/<version>` branch, pushes it and opens a PR to `main` titled `release(desktop): Release v<version>`. Only the inputs commit in step 2 goes through the lint-staged hook; if that hook fails, fix the cause and commit again.
4. Record `VERSION`, `PREV` (the last tag's version) and `PR` (`gh pr view --json number,url`).

### A6. Check the generated state

On `release/desktop/<version>`: `apps/desktop/package.json` has the expected `version` and `runtimeVersion`, `release.json` matches the mode, `release-plan.json` is back to the default `build` template, and the PR exists against `main`.

## Phase B: Verify the PR build

Everything that ships is settled here. Once the post-merge release run creates the GitHub release, even as a prerelease, the OTA worker offers the update to direct-download users within about five minutes. Never merge with an open blocker.

### B1. Wait for CI

```bash
HEAD_SHA=$(git rev-parse HEAD)
gh run list --workflow build-desktop.yml --branch "release/desktop/$VERSION" --event push \
  --json databaseId,headSha,status --jq ".[] | select(.headSha == \"$HEAD_SHA\") | .databaseId"
```

Watch that run and the PR checks in the background (`gh run watch <run-id> --exit-status --interval 60`, `gh pr checks "$PR" --watch --interval 60`). The push build is the staging variant ("Folo Staging" against the production API) and takes 10–20 minutes; a new push to the branch cancels it. Artifacts: `macos-arm64-dmg`, `macos-x64-dmg`, `windows-x64-exe` (unsigned on purpose), `linux-x64-appimage`, `linux-x64-deb`. If a job fails, read `gh run view <run-id> --log-failed`; rerun once for infrastructure flakes (`gh run rerun <run-id> --failed`), otherwise stop and report.

Write the verification plan (B2) while it runs.

### B2. Write the verification plan

Create `$SCRATCH/verification.md` with one row per item: what to check, where (window, settings, tray, menu, updater), account state (signed in or guest), expected result, evidence file, result.

- Every changelog entry.
- Every risky commit, even one without an entry: main process, preload and IPC, updater, auth, sync engine, networking, packaging.
- The smoke suite: launch to the timeline without an error toast; Settings → About shows the new version; switch views and open an entry in the reader; open each settings tab; switch the UI language to 简体中文 and back; Discover and search render; the AI panel opens (the demo account has a plan); no new errors in `main.log`; a clean quit.
- Items that need Windows or Linux: "not run on macOS", static checks only.

### B3. Verify the macOS package

Follow `references/verify-macos-build.md`: download `macos-arm64-dmg`, check checksum, signature and notarization, launch an isolated copy signed in to the demo account, work through the plan with `agent-browser`, then tear down. Take a screenshot for every item. Check the x64 build statically.

### B4. Check the Windows and Linux artifacts

```bash
gh run download <run-id> -n windows-x64-exe -D "$SCRATCH/pr/windows"
gh run download <run-id> -n linux-x64-appimage -D "$SCRATCH/pr/linux"
gh run download <run-id> -n linux-x64-deb -D "$SCRATCH/pr/linux"
```

File names carry the new version, and the exe's and the AppImage's sha512 (`openssl dgst -sha512 -binary <file> | base64`) and size match `latest.yml` and `latest-linux.yml`. The deb is not listed in `latest-linux.yml` (forge skips it), so only its file name is checked. The PR installer is unsigned by design; signing happens in the release run (C3).

### B5. Decide

- Pass: every item passed or carries a non-blocking note, and the PR checks are green.
- Blocking: a crash or hang at launch, a wrong version or bundle, a signature or notarization failure, a changelog item that does not work, a regression in a core flow, red PR checks.

On a blocker, stop and tell the user with the evidence and a proposed fix. A fix lands on `dev` first (normal workflow, tests included) and is then cherry-picked onto `release/desktop/<version>`; the push rebuilds the packages and B1–B5 run again.

## Phase C: Merge and ship

### C1. Merge

```bash
gh pr view "$PR" --json state,mergeable,mergeStateStatus --jq .
gh pr merge "$PR" --merge
MERGE_SHA=$(gh pr view "$PR" --json mergeCommit --jq .mergeCommit.oid)
```

Use a merge commit: the repository's default merge message puts the PR title in the body, and `tag.yml` reads it from there. No `--admin`, no squash or rebase. `main` only forbids deletion and force pushes, and merged branches are deleted automatically.

### C2. Watch the post-merge workflows

1. `🏷️ Release Orchestrator` (`tag.yml`) runs for `MERGE_SHA`, creates `desktop/v<version>` and the next `desktop-build/v<N>` tag (the Mac App Store build number), and dispatches two `🖥️ Build Desktop` runs on `main`:
   - the release run (`tag_version`): macOS, Ubuntu and Windows jobs plus `publish-release`, which creates the GitHub release as a prerelease. About 20 minutes.
   - the store run (`store`): macOS builds the Mac App Store pkg and uploads it with `altool`, Windows builds the `.appx`. No Ubuntu job and no `publish-release`. About 30 minutes.
   ```bash
   gh run list --workflow tag.yml --branch main --limit 3 --json databaseId,headSha,status,conclusion
   gh run list --workflow build-desktop.yml --branch main --event workflow_dispatch --limit 4 \
     --json databaseId,createdAt,status
   gh run view <run-id> --json jobs --jq '[.jobs[].name]'
   ```
   Watch both runs in the background.
2. The push-triggered Build Desktop run on `main` is skipped on purpose (the merge commit carries `release(desktop):`).
3. `🔄 Sync Release Branches To Dev` opens `chore(sync): merge main into dev` with auto-merge (C8).

### C3. Get the Windows installer signed (SignPath)

The release run's Windows job submits the installer to SignPath (organization `8c651516-fdaf-40a1-9fea-001dffde850e`, project `Folo`, signing policy `release-signing`, artifact configuration `github`). The request waits for manual approval, and the step gives up after about ten minutes. Because of `continue-on-error`, the step and the job still report success and the unsigned installer ships. That is how 1.12.0 and 1.14.0 went out unsigned; the step status never tells you whether signing happened.

1. Sign in to `https://app.signpath.io` in Chrome early, so you are ready when the request arrives (Okta sign-in at `login.signpath.io`; 1Password per `references/browser-and-credentials.md`).
2. Wait in the background for the signing step to start:
   ```bash
   for i in $(seq 1 90); do
     JOB=$(gh run view <release-run> --json jobs --jq '.jobs[] | select(.name == "release (windows-latest)") | .databaseId')
     s=$([ -n "$JOB" ] && gh api "repos/RSSNext/Folo/actions/jobs/$JOB" --jq '[.steps[] | select(.name | test("signpath"; "i")) | .status][0]')
     echo "$JOB $s"; [ "$s" = in_progress ] || [ "$s" = completed ] && break; sleep 20
   done
   ```
3. Open the waiting signing request. Approve it only if it matches: project `Folo`, policy `release-signing`, origin repository `RSSNext/Folo`, workflow `build-desktop.yml`, the release run's ID, branch `main`, commit `MERGE_SHA`. Anything else: don't approve, report.
4. When the Windows job has finished (the whole run's log is unavailable until the run ends, the job's log is not), confirm SignPath completed:
   ```bash
   gh run view <release-run> --job "$JOB" --log | grep -iE 'signing request status is|timed out|not completed' | tail -3
   ```
   The last line must say `Completed`. C4 checks the signature on the published file.

If it timed out anyway, the unsigned installer is already out: `publish-release` attaches it to the prerelease and the OTA worker, which only skips drafts, starts offering it to direct installs within about five minutes. Tell the user right away. The fix is `gh run rerun --job "$JOB"` (the job's `databaseId`), which reruns the Windows job and the dependent `publish-release` (the release becomes a prerelease again and its assets are replaced), followed by a timely approval and the C4 checks. Whether to turn the release into a draft meanwhile, which stops the distribution, is the user's call.

### C4. Publish the GitHub release

After `publish-release` succeeds:

```bash
gh release view "desktop/v$VERSION" --json isDraft,isPrerelease,assets \
  --jq '{isDraft, isPrerelease, assets: [.assets[].name]}'
```

Expected assets: `Folo-<version>-linux-x64.AppImage`, `Folo-<version>-linux-x64.deb`, `Folo-<version>-macos-arm64.dmg` and `.zip`, `Folo-<version>-macos-x64.dmg` and `.zip`, `Folo-<version>-windows-x64.exe`, `latest.yml`, `latest-mac.yml`, `latest-linux.yml`, `manifest.yml`, `ota-release.json`, `render-asset.tar.gz`, plus `dist.tar.zst` in `ota` mode.

Download into `$SCRATCH/release` (`gh release download "desktop/v$VERSION" -p <pattern> -D "$SCRATCH/release"`) and check:

- the sha512 and size of the macOS arm64 dmg, the Windows exe and the AppImage match their `latest*.yml`;
- the installer is signed: `node .agents/skills/desktop-release/scripts/pe-signature.mjs <exe>` prints `"signed": true` and `"signPathFoundation": true` (SignPath signs Folo with a SignPath Foundation certificate issued by GlobalSign; a properly signed 1.13.0 shows exactly that);
- the macOS release app ("Folo", the new version) passes the static checks in `references/verify-macos-build.md` §1;
- the release body is the changelog, not the "No changelog file found" fallback.

Then publish it as the latest release:

```bash
gh release edit "desktop/v$VERSION" --prerelease=false --latest
gh release view "desktop/v$VERSION" --json isPrerelease --jq .isPrerelease    # false
gh api repos/RSSNext/Folo/releases/latest --jq .tag_name                      # desktop/v<version>
```

`gh release view` has no `isLatest` field; the `releases/latest` endpoint is the check.

### C5. Check the OTA worker

The worker syncs GitHub releases every five minutes. Within about 15 minutes of C4:

```bash
curl -fsS https://ota.folo.is/versions | jq '.github.desktop'
for p in desktop/macos/dmg desktop/windows/exe desktop/linux; do
  curl -fsS -H "X-App-Platform: $p" -H "X-App-Version: $PREV" -H "X-App-Channel: stable" \
    https://ota.folo.is/manifest | jq -c --arg p "$p" '{platform: $p, app: .app.version, renderer: .renderer.version}'
done
curl -sI https://ota.folo.is/download/desktop/macos/dmg | grep -i '^location'
```

`app` is the new version for direct installs. In `ota` mode, also ask as an installed `runtimeVersion` binary (`X-App-Version` and `X-App-Runtime-Version` set to the runtime version, `X-App-Renderer-Version` set to `$PREV`) and expect `renderer` to be the new version. If anything is still stale after 15 minutes, report it; the sync token is not available locally.

In `ota` mode the PR check ran the new renderer on a new binary, so also check it on the old one. Download `Folo-<runtimeVersion>-macos-arm64.dmg` from the `desktop/v<runtimeVersion>` release and launch it as in `references/verify-macos-build.md` §2 (isolated demo profile copy, restricted `PATH`). Wait for `Renderer hot update applied successfully: <version>` in `main.log`, relaunch if the window did not reload, then check that `window.version` is the new version, `window.electron.ipcRenderer.invoke('app.getAppVersion')` is still the runtime version, and the changelog items work. Tear down as in §4.

### C6. Mac App Store

Follow `references/store-submissions.md` § Mac App Store: confirm the store run uploaded the pkg, wait for processing, rename or create the macOS version, fill What's New in every locale, validate, submit with `asc`, and confirm `WAITING_FOR_REVIEW` with `asc` and in App Store Connect.

### C7. Microsoft Store

Follow `references/store-submissions.md` § Microsoft Store: download the `.appx` from the store run, check its identity and version, start an update in Partner Center, upload the package, fill What's New, and submit for certification.

### C8. Sync PR

```bash
gh pr list --base dev --head main --state all --limit 1 \
  --json number,state,mergedAt,mergeStateStatus,autoMergeRequest
```

`dev` requires `Format, Lint and Typecheck (lts/*)` and `Build web and SSR server (lts/*)`. The PR is opened with the workflow token, which starts no `pull_request` workflows, but the push to `main` runs both checks on the same commit, so the sync PR normally auto-merges within minutes. Check with `gh pr checks <n> --required`. Merged, or the required checks running: fine. Checks missing or failing, or conflicts: report it with the details, and don't push to `dev` or `main` to force it unless the user asks. The next release's pre-flight depends on it.

### C9. Report and clean up

Tell the user: version, mode and `runtimeVersion`; PR and merge commit; tag; GitHub release URL and signing status; OTA checks; Mac App Store version state; Microsoft Store submission number and state; the sync PR; the verification summary with `verification.md` and the key screenshots; anything not verified and why. Store reviews finish later; say how to check them (`asc versions list`, the Partner Center overview).

Clean up: quit the test app, restore `~/.folo/config.json` if it changed, unregister and delete app copies, profile copies and mounts, delete the downloads (keep the report and screenshots), close the browser tabs you opened, and release any granted credentials.

### C10. Announcement kit

Follow `.agents/skills/release-promo/SKILL.md`: pick the highlights, draft the X post, its reply with the release links and a one-sentence quote line for the second account, and render the promo video from the store captures. If a mobile release runs in the same session, make one kit for both after the later release's report. These are drafts; the user posts them.

## Failure handling

- The bump fails halfway: nbump restores `package.json` only when a trailing hook fails and rolls nothing back after a leading hook fails. Check `git status` and `git branch --list 'release/desktop/*'`, restore the tree with `git restore --staged --worktree apps/desktop` and delete the generated `apps/desktop/changelog/<version>.md` if the bump renamed `next.md`. Ask before deleting a leftover local release branch. If the branch reached GitHub but `gh pr create` failed, open the PR by hand with the title and body from `bump.config.ts`.
- A CI build or PR check fails: read the failed log, rerun once for flakes, otherwise stop before merging and report.
- Verification fails: stop before merging (B5).
- `tag.yml` fails or creates no tag: read its log. The usual causes are a merge message without the PR title or a `release.json` version mismatch. Report; never create release tags by hand.
- The store run fails at the Mac App Store upload: read the `altool` output; rerun the failed job once for transient errors (`gh run rerun <store-run> --failed`), otherwise report.
- App Store processing ends `INVALID` or `FAILED`: report with the build ID; App Store Connect emails the reason.
- A console asks to accept new agreements, terms or declarations: stop and ask; only the account holder can accept.
- A 1Password prompt times out: tell the user, continue with steps that don't need that login, retry once the user responds.
- Never delete releases, tags, builds or submissions to start over; ask first.

## Reference

- Claude Code adapter: `.claude/skills/desktop-release/SKILL.md`
- Bump config: `apps/desktop/bump.config.ts`
- Changelog: `apps/desktop/changelog/` (`next.template.md`), `apps/desktop/scripts/apply-changelog.ts`
- Release plan and config: `apps/desktop/release-plan.json`, `apps/desktop/release.json`, `apps/desktop/scripts/apply-release-config.impl.ts`
- Release config resolver: `.github/scripts/resolve-desktop-release-config.mjs`
- OTA metadata builder: `.github/scripts/build-ota-release.mjs`; Mac App Store upload: `.github/scripts/upload-mas-pkg.sh`
- Workflows: `.github/workflows/build-desktop.yml`, `.github/workflows/tag.yml`, `.github/workflows/sync.yaml`
- OTA worker: `apps/ota` (its `README.md` lists manifest and policy checks); desktop updater: `apps/desktop/layer/main/src/updater/`
- Announcement kit: `.agents/skills/release-promo/SKILL.md`; promo video renderer: `store-assets/scripts/release-video.ts`
- `references/verify-macos-build.md`, `references/store-submissions.md`, `references/release-notes.md`, `references/browser-and-credentials.md`, `scripts/pe-signature.mjs`
