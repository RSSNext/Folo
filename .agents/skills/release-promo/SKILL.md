---
name: release-promo
description: Announcement of a Folo release on X - the post with the highlights and a 1080p promo video rendered from real app captures, its reply with the release links, both from @folo_is, and a quote-post from @rss3_. The desktop and mobile release skills end with it; also use it when the user asks to announce a release or for promo material.
argument-hint: "[releases, e.g. 'desktop 1.15.0 mobile 0.5.11'; defaults to the releases this session shipped]"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Release Promo

The announcement kit for a Folo release, shared by every agent. Claude Code reaches it through `.claude/skills/release-promo/SKILL.md`, which maps these steps onto Claude's tools. The desktop and mobile release skills run it as their last step. Change the flow here, not in the adapter.

The kit has four parts:

- **Post**: the announcement on X in the house format, with the video attached.
- **Reply**: the release links, posted as the first reply to the post.
- **Quote line**: one sentence the second (matrix) account, @rss3_, adds when it quote-posts the announcement.
- **Video**: 20–30 seconds at 1920 × 1080, rendered from real app captures by `store-assets/scripts/release-video.ts`.

## Standing authorization

Running this skill as the last step of a release skill, or because the user asked to announce a release, is the user's approval to publish the kit on X once it passes its checks (§6): the post with the video and the reply from @folo_is, then the quote-post from @rss3_.

Nothing beyond that: no other accounts, no likes, follows, DMs, pins or scheduled posts, and no edits or deletions of any post; ask first for those. When the user asks only for drafts or promo material, deliver drafts (§7) and offer to publish them.

## Inputs

- Releases: the ones this session shipped. When desktop and mobile both ship in one session, make one kit for both after the later release's report. Outside a release run, cover the releases the user names; if they name none, ask, offering the newest tags (`git tag --sort=-creatordate | grep -E '^(desktop|mobile)/v' | head -4`).
- Changelogs: `apps/desktop/changelog/<version>.md`, `apps/mobile/changelog/<version>.md`.
- The releases' verification reports, when there are any. Headline only what shipped and passed; an item that was not run or only checked statically is no highlight.
- Working directory: `$SCRATCH/promo` in the release's scratch space, or a temporary directory.

## 1. Pick the highlights

Choose three or four changes across the releases, the most noticeable first. Each becomes one line of the post and one scene of the video, in the same order.

- Say what users get, not how it was built: "Settings sync across devices again", not "PATCH /settings covers non-local keys".
- Merge entries that belong together (settings sync and action language sync are one highlight).
- The last highlight may bundle a platform upgrade with the fixes ("Desktop on Electron 44, plus fixes").
- Name languages in their own script (中文, 日本語, Français). No competitor names, rankings or prices.

## 2. Post

Every announcement has the same shape. The user wrote the first one; follow it:

```text
Folo update time 💫 desktop 𝐯𝟏.𝟏𝟒.𝟎 and mobile 𝐯𝟎.𝟓.𝟏𝟎 are here!

Highlights:
🔄 Incremental sync, fewer requests
⚡ Instant read & star marks, even offline
📱 Reading settings, dark mode, immersive reading
🌐 Desktop follows your system proxy

👇 Full details below
```

```text
Folo update time 💫 desktop 𝐯𝟏.𝟏𝟓.𝟎 and mobile 𝐯𝟎.𝟓.𝟏𝟏 are here!

Highlights:
🔁 Settings sync across devices again
🎧 Steadier text-to-speech on long reads
🌍 Fully translated into 中文, 日本語 & Français
⚡ Desktop on Electron 44, plus fixes

👇 Full details below
```

- Keep the first line, "Highlights:" and "👇 Full details below" as they are. For one app: "Folo update time 💫 desktop 𝐯𝟏.𝟏𝟓.𝟎 is here!".
- Versions are in math bold: `node .agents/skills/release-promo/scripts/x-post.mjs bold 1.15.0`.
- One emoji per highlight, each different and matching its topic, neither 💫 nor 👇.
- No links (they go in the reply), hashtags or mentions.
- At most 280 by X's weighting, where CJK, emoji and math bold count twice; both posts above weigh 276. Shorten the highlights rather than drop parts of the format. Check every draft:
  ```bash
  node .agents/skills/release-promo/scripts/x-post.mjs count post.txt reply.txt quote.txt
  ```

## 3. Reply

```text
Desktop v1.15.0: github.com/RSSNext/Folo/releases/tag/desktop/v1.15.0
Mobile v0.5.11: github.com/RSSNext/Folo/releases/tag/mobile/v0.5.11
Download: folo.is
```

One line per release with the plain version, then the download link. Every linked release must be published (`gh release view <tag> --json isDraft`).

## 4. Quote line

One sentence summing up the release, in English like every @rss3_ quote so far. No version numbers, links, hashtags or emoji: the quoted post carries those.

```text
New Folo is out: your settings follow you to every device again, long reads get text-to-speech that holds up, and every screen now speaks Chinese, Japanese and French.
```

## 5. Video

### Captures

The video shows real app screens only: the store screenshot captures, `store-assets/captures/<locale>/<device>/<scene>.png` (`store-assets/README.md`). They are not committed. The full set lives in `~/Code/Projects/folo-store-media/captures`, which checkouts link as `store-assets/captures`; otherwise find a checkout that holds a set and use the newest one:

```bash
ROOT=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
ls -d ~/Code/Projects/folo-store-media/captures 2>/dev/null
find "$ROOT/store-assets" "$ROOT/.claude/worktrees" -maxdepth 3 -path '*store-assets/captures' \( -type d -o -type l \) 2>/dev/null
```

`ls <captures>/en/*` lists the shots. `listen` and `summary` phone shots come with a `.json` region (the player bar, the AI summary card) that a callout can enlarge.

A capture shows the app as it was when it was taken. The script prints each shot's capture time; compare it with the commits behind a highlight (`git log -1 --date=format-local:'%Y-%m-%d %H:%M' --format=%cd <sha>`) and never show a screen captured before its change landed. The `fr` captures of 2026-10-01, for example, still show the English title case b7df9ad01 removed. A highlight without a fitting capture gets a neutral screen (`hero`, `timeline`) and leaves the message to the copy. New captures change the shared demo account's subscriptions and language, so ask the user before taking them.

### Spec

Write `$SCRATCH/promo/video.json`, starting from `store-assets/promo/example.json` (the desktop 1.15.0 / mobile 0.5.11 video, which uses every layout). The format is documented at the top of `store-assets/scripts/release-video.ts`:

- `desktop`, `mobile`: the released versions; leave one out for a single-app release.
- `scenes`: one per highlight, in the post's order. Each has an `eyebrow` (a MingCute icon name such as `refresh-2-line` and one to three words naming the area) and a two-line `headline` whose second line is wrapped in `*…*` for the accent gradient, then a one-sentence `sub`, or `items` (up to five one-line checks, for fixes), plus `chips` for a set of names such as languages.
- `visual`: `mac` (one Mac shot, or several that crossfade while the chips light up in step), `mac-phone` (a Mac and a phone for changes across devices, with an optional spinning `badge`) or `phones` (one or two phones, with an optional `callout` naming the shot whose region to enlarge).
- `duration` in ms, when the default 4.6 s does not suit a scene.

The copy is English, like the post. The intro ("Folo update time." with the versions) and the outro ("Update today." with folo.is) are fixed.

### Render and review

```bash
pnpm exec tsx store-assets/scripts/release-video.ts "$SCRATCH/promo/video.json" --captures <captures> --stills "$SCRATCH/promo/stills"
```

It prints the timeline and every shot with its capture time, writes one frame per scene and `contact-sheet.png`, and reports text that wraps or leaves its area as `PROBLEM` lines (exit code 1). Fix the spec until none are left, then look at each still: the screen matches the highlight, the copy reads well, nothing is cut off or shows through.

```bash
pnpm exec tsx store-assets/scripts/release-video.ts "$SCRATCH/promo/video.json" --captures <captures> --video "$SCRATCH/promo/folo-<versions>.mp4"
ffprobe -v error -show_entries stream=codec_name,width,height,pix_fmt,r_frame_rate:format=duration,size -of compact "$SCRATCH/promo/folo-<versions>.mp4"
```

Expect `h264`, 1920 × 1080, `yuv420p`, `30/1` and the timeline's length; X takes the file as it is. The video has no sound. Rendering needs Playwright's Chromium (`pnpm exec playwright install chromium`), `ffmpeg`, and network access for the web fonts.

## 6. Publish on X

Before the first post:

- Every linked release is published (§3), the video rendered without `PROBLEM` lines and you looked at every still, and each draft weighs at most 280.
- X runs in the user's browser, signed in. The account switcher at the bottom of the left sidebar holds @folo_is (Folo) and @rss3_ (RSS3) next to the user's own account. Note which account is active, to switch back at the end. If either account is missing or signed out, don't post: deliver drafts (§7) and say why.

Then one step at a time, checking each result before the next:

1. Switch to @folo_is. In the home composer, attach the video through the composer's file input (the "Add photos or video" button opens a native file picker), type the post and wait until the upload reads "Ready". Check the text and the character counter, then Post.
2. Open `x.com/folo_is` and find the new post; it can take several seconds to show up, so reload rather than post again. Open it, check the text and the video, and reply with the reply text from the same account.
3. Switch to @rss3_. Open the Folo post, choose Repost > Quote, type the quote line and Post.
4. Check `x.com/folo_is` (the post with its video, the reply under it) and `x.com/rss3_` (the quote) and keep the three URLs. Switch back to the account that was active before and close the tab.

When a Post click's result is unclear, look at the profile before trying again: a duplicate is worse than a delay. When something went out wrong (a typo, the wrong account, a missing video), stop and tell the user; never edit or delete a post on your own. When a step fails, report what is already posted and deliver the rest as drafts.

## 7. Report

In one message:

- the URLs of the post, the reply and the quote; for anything not posted, its text in a code block with its weighted length and how to publish it (video on the post, links as the first reply, quote-post from @rss3_)
- the video and the contact sheet
- anything left out and why, such as a highlight without a capture or a claim dropped because it was not verified
