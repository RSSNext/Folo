---
name: desktop-release
description: Full Folo desktop release from dev to the stores. Drafts the changelog, picks the build or ota mode, bumps the version and opens the release PR, verifies the packages GitHub Actions builds for the PR and every change in the release, merges the PR, watches the tag and store builds, gets the Windows installer signed, publishes the GitHub release, submits the Mac App Store and Microsoft Store builds for review, and drafts the announcement post and promo video. Use when the user asks to release, ship or publish the desktop app.
disable-model-invocation: true
argument-hint: "[optional notes, e.g. a preferred mode or the OTA runtime]"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Desktop Release (Claude Code)

Read `.agents/skills/desktop-release/SKILL.md` completely before doing anything, then follow it step by step, reading each file under `.agents/skills/desktop-release/references/` when a step points to it. That file is the release flow shared by every agent, including the standing authorization and the definition of done. This file only maps it onto Claude Code's tools and adds the limits that apply to Claude. Change the flow there, not here.

## Tools

- Waiting: run `gh run watch …` and polling loops as background Bash commands (`run_in_background: true`); you are re-invoked when they exit. Never sleep in the foreground; do the next independent step meanwhile.
- Confirmation gate (A4): AskUserQuestion with Proceed / Edit something / Stop.
- Release PR (A5): in the Claude desktop app, bind it with the ccd_pr tools (`get_status`, then `bind_pr`) so it shows in the PR pane.
- Scratch space: `<session scratchpad>/desktop-release-<version>`.
- Electron renderer: `agent-browser --cdp <port>` (`tab`, `snapshot -i`, `click @eN`, `screenshot <path>`, `eval`); `eval` resolves promises but rejects top-level `await`.
- Native macOS UI (menus, dialogs, tray): computer-use, after `request_access` for the app; context menus need a full-screen `right_click`.
- Browser: Claude in Chrome (`mcp__claude-in-chrome__*`), the user's Chrome. Load these in one ToolSearch call: `tabs_context_mcp`, `tabs_create_mcp`, `tabs_close_mcp`, `navigate`, `computer`, `find`, `read_page`, `get_page_text`, `javascript_tool`, `form_input`, `file_upload`, `browser_batch`, `request_credentials`, `autofill_credential`, `enter_verification_code`, `list_granted_credentials`, `release_credentials`. Call `tabs_context_mcp` with `createIfEmpty: true`, work in your own tab from `tabs_create_mcp`, and close it with `tabs_close_mcp` at the end.
- Sign-in: one `request_credentials` call per phase (kind `login`) for the logins that phase needs:
  - App Store Connect: website `https://appleid.apple.com`, keywords `apple`, `app store connect`, `diygod@rss3.io`
  - Microsoft Partner Center: website `https://login.microsoftonline.com`, keywords `microsoft`, `partner center`, `natural selection labs`
  - SignPath: website `https://login.signpath.io`, keywords `signpath`

  Then `autofill_credential` on the sign-in page (on `multiple_matches`, `list_granted_credentials` and pass the `credentialId`). For a code sent by SMS or email, click the code field and call `enter_verification_code`. Call `release_credentials` when the store phase is done.

- Uploads: `file_upload` takes under 10 MB per call and the limit counts across a whole `browser_batch`, so call it on its own. The `.appx` goes up with the chunked recipe in `references/store-submissions.md`; find the injected input with `find` "Folo chunk input".
- Chrome quirks: when a ref click does nothing, take a screenshot and click by coordinates. Extension output containing `key=value` query strings can come back as "[BLOCKED: Cookie/query string data]"; read such values from the DOM in pieces.
- Report (C9): reply in the user's language and send the key screenshots and `verification.md` with SendUserFile when available. Save new learnings about the consoles or the pipeline to memory.
- Announcement kit (C10): follow `.claude/skills/release-promo/SKILL.md`.

## Limits that apply to Claude

- Never type a password, one-time code or session token into an app, a page or a command yourself. Store and SignPath sign-ins go through `autofill_credential`, where 1Password fills the page and you never see the value.
- The demo account (1Password item `mczvztynp5if7izw5wvmoggtru`) signs in to production, so you may not enter its password into the desktop app, even when the user offers it. Use a profile that already holds its session (`Folo(release-qa)`, else `Folo(store-demo)`). If neither exists, ask the user to sign in once to `Folo(release-qa)` as described in `references/verify-macos-build.md` §2, and mark the signed-in items "not run" until then.
