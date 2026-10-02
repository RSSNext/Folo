---
name: mobile-release
description: Full Folo mobile release from dev to the stores. Decides between a store release and an OTA-only release, drafts the changelog, bumps the version and opens the release PR to mobile-main, verifies the PR's CI-built Android package and the iOS build on a simulator along with every change in the release, merges the PR, watches the build or OTA workflows, publishes the GitHub release, submits the iOS build for App Store review and the Android build for Google Play review, and drafts the announcement post and promo video. Use when the user asks to release, ship or publish the mobile app.
disable-model-invocation: true
argument-hint: "[optional notes, e.g. 'ota' or 'minor bump']"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Mobile Release (Claude Code)

Read `.agents/skills/mobile-release/SKILL.md` completely before doing anything, then follow it step by step, reading each file under `.agents/skills/mobile-release/references/` when a step points to it. That file is the release flow shared by every agent, including the standing authorization and the definition of done. This file only maps it onto Claude Code's tools and adds the limits that apply to Claude. Change the flow there, not here.

## Tools

- Waiting: run `gh run watch …`, simulator builds and polling loops as background Bash commands (`run_in_background: true`); you are re-invoked when they exit. Never sleep in the foreground; do the next independent step meanwhile.
- Confirmation gate (A4): AskUserQuestion with Proceed / Edit something / Stop.
- Release PR (A5): in the Claude desktop app, bind it with the ccd_pr tools (`get_status`, then `bind_pr`) so it shows in the PR pane.
- Scratch space: `<session scratchpad>/mobile-release-<version>`.
- iOS simulator: the `axe` CLI, or the iOS Simulator MCP tool (`mcp__Claude_Code_iOS_Simulator__control`); in the Claude desktop app, `attach` its panel so the user can watch. Simulators only, never the user's physical devices.
- Android emulator: `adb`, `emulator` and the build-tools commands in `references/verify-android-build.md`.
- Browser: Claude in Chrome (`mcp__claude-in-chrome__*`), the user's Chrome. Load these in one ToolSearch call: `tabs_context_mcp`, `tabs_create_mcp`, `tabs_close_mcp`, `navigate`, `computer`, `find`, `read_page`, `get_page_text`, `javascript_tool`, `form_input`, `browser_batch`, `request_credentials`, `autofill_credential`, `enter_verification_code`, `list_granted_credentials`, `release_credentials`. Call `tabs_context_mcp` with `createIfEmpty: true`, work in your own tab from `tabs_create_mcp`, and close it with `tabs_close_mcp` at the end.
- Sign-in: one `request_credentials` call per phase (kind `login`) for the logins that phase needs:
  - Google Play Console: website `https://accounts.google.com`, keywords `google`, `diygod@rss3.io`, `rss3`, `play console`
  - App Store Connect: website `https://appleid.apple.com`, keywords `apple`, `app store connect`, `diygod@rss3.io`

  Then `autofill_credential` on the sign-in page (on `multiple_matches`, `list_granted_credentials` and pass the `credentialId`). For a code sent by SMS or email, click the code field and call `enter_verification_code`. Call `release_credentials` when the store phase is done.

- Chrome quirks: when a ref click does nothing (the Google account chooser is one such place), take a screenshot and click by coordinates. Extension output containing `key=value` query strings can come back as "[BLOCKED: Cookie/query string data]"; read such values from the DOM in pieces.
- Report (C8): reply in the user's language and send the key screenshots and `verification.md` with SendUserFile when available. Save new learnings about the consoles or the pipeline to memory.
- Announcement kit (C9): follow `.claude/skills/release-promo/SKILL.md`.

## Limits that apply to Claude

- Never type a password, one-time code or session token into an app, a page or a command yourself. Store sign-ins go through `autofill_credential`, where 1Password fills the page and you never see the value.
- The demo account (1Password item `mczvztynp5if7izw5wvmoggtru`) signs in to production, so you may not enter its password into the simulator or emulator app, even when the user offers it. Signed-in checks need the QA simulator "Folo Release QA" and the QA emulator `Folo_Release_QA` to already hold its session. If one is missing or signed out, create or boot it, install the app, and ask the user to sign in on it once (they can paste the password from 1Password); mark the signed-in items "not run" for that platform until then.
