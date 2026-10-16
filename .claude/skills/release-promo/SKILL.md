---
name: release-promo
description: Announcement kit for a Folo release - the X post with the highlights, its reply with the release links, a one-sentence quote line for the second account, and a 1080p promo video rendered from real app captures. The desktop and mobile release skills end with it; also use it when the user asks for promo material for a release.
argument-hint: "[releases, e.g. 'desktop 1.15.0 mobile 0.5.11'; defaults to the releases this session shipped]"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Release Promo (Claude Code)

Read `.agents/skills/release-promo/SKILL.md` completely, then follow it. That file is the flow shared by every agent; this one only maps it onto Claude Code's tools. Change the flow there, not here.

- Working directory: `$SCRATCH/promo` when a release skill runs it, `<session scratchpad>/release-promo` otherwise.
- Review: look at `contact-sheet.png` and each still with Read before rendering the video.
- Video: run the `--video` render as a background Bash command (`run_in_background: true`) and finish the drafts meanwhile.
- Deliver: reply in the user's language with each draft in a fenced `text` block, and send the video and the contact sheet with SendUserFile.
- Never post: don't open X or any other social account in Claude in Chrome, computer-use or any other tool for this skill.
