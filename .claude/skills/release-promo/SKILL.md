---
name: release-promo
description: Announcement of a Folo release on X - the post with the highlights and a 1080p promo video rendered from real app captures, its reply with the release links, both from @folo_is, and a quote-post from @rss3_. The desktop and mobile release skills end with it; also use it when the user asks to announce a release or for promo material.
argument-hint: "[releases, e.g. 'desktop 1.15.0 mobile 0.5.11'; defaults to the releases this session shipped]"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Release Promo (Claude Code)

Read `.agents/skills/release-promo/SKILL.md` completely, then follow it. That file is the flow shared by every agent; this one only maps it onto Claude Code's tools. Change the flow there, not here.

- Working directory: `$SCRATCH/promo` when a release skill runs it, `<session scratchpad>/release-promo` otherwise.
- Review: look at `contact-sheet.png` and each still with Read before rendering the video.
- Video: run the `--video` render as a background Bash command (`run_in_background: true`) and finish the drafts meanwhile.
- Publish: Claude in Chrome (`mcp__claude-in-chrome__*`), the user's Chrome, where X holds the user's accounts. Load whichever of these is not loaded yet in one ToolSearch call: `tabs_context_mcp`, `tabs_create_mcp`, `tabs_close_mcp`, `navigate`, `computer`, `find`, `javascript_tool`, `file_upload`, `browser_batch`. Work in your own tab and close it at the end. Use only Claude in Chrome for X, never computer-use.
  - Accounts: `document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]').innerText` names the active account. Click that button, take a screenshot and click the account's row by its coordinates.
  - Video: `find` the composer's file input (`type="file"`) and pass the mp4 to `file_upload`, which takes up to 10 MB. Re-encode a larger render into a copy (`ffmpeg -i <in> -c:v libx264 -crf 28 -pix_fmt yuv420p -an <out>`), check it with ffprobe and upload that.
  - Text: click the composer, then `computer` `type` with the draft's exact text; math bold, emoji and line breaks come through as typed. Take a screenshot before every Post.
  - URLs: read the newest posts from a profile page with `javascript_tool`, e.g. `[...document.querySelectorAll('article')].slice(0, 3).map(a => [...a.querySelectorAll('a[href*="/status/"]')].map(x => x.getAttribute('href')).find(h => /\/status\/\d+$/.test(h)))`.
- Report: reply in the user's language with the three post links (anything not posted in a fenced `text` block), and send the video and the contact sheet with SendUserFile.
