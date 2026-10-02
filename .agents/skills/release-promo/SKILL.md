---
name: release-promo
description: Announcement kit for a Folo release - the X post with the highlights, its reply with the release links, a one-sentence quote line for the second account, and a 1080p promo video rendered from real app captures. The desktop and mobile release skills end with it; also use it when the user asks for promo material for a release.
argument-hint: "[releases, e.g. 'desktop 1.15.0 mobile 0.5.11'; defaults to the releases this session shipped]"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Release Promo

The announcement kit for a Folo release, shared by every agent. Claude Code reaches it through `.claude/skills/release-promo/SKILL.md`, which maps these steps onto Claude's tools. The desktop and mobile release skills run it as their last step. Change the flow here, not in the adapter.

The kit has four parts:

- **Post**: the announcement on X in the house format, with the video attached.
- **Reply**: the release links, posted as the first reply to the post.
- **Quote line**: one sentence the second (matrix) account adds when it quote-posts the announcement.
- **Video**: 20–30 seconds at 1920 × 1080, rendered from real app captures by `store-assets/scripts/release-video.ts`.

Everything here is a draft for the user. Never post, schedule or upload anything to X or another account; the user publishes the kit.

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
  node .agents/skills/release-promo/scripts/x-post.mjs count post.txt reply.txt quote-en.txt quote-zh.txt
  ```

## 3. Reply

```text
Desktop v1.15.0: github.com/RSSNext/Folo/releases/tag/desktop/v1.15.0
Mobile v0.5.11: github.com/RSSNext/Folo/releases/tag/mobile/v0.5.11
Download: folo.is
```

One line per release with the plain version, then the download link. Every linked release must be published (`gh release view <tag> --json isDraft`).

## 4. Quote line

One sentence summing up the release, in English and in Simplified Chinese; the user picks. No version numbers, links, hashtags or emoji: the quoted post carries those.

```text
New Folo is out: your settings follow you to every device again, long reads get text-to-speech that holds up, and every screen now speaks Chinese, Japanese and French.
```

```text
Folo 新版上线：设置重新跨设备同步，长文朗读更稳，界面完整支持简繁中文、日文和法文。
```

## 5. Video

### Captures

The video shows real app screens only: the store screenshot captures, `store-assets/captures/<locale>/<device>/<scene>.png` (`store-assets/README.md`). They are not committed, so find the checkout that holds them and use the newest set:

```bash
ROOT=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
find "$ROOT/store-assets" "$ROOT/.claude/worktrees" -maxdepth 3 -type d -path '*store-assets/captures' 2>/dev/null
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

## 6. Deliver

In one message:

- the post, the reply and both quote lines, each in its own code block with its weighted length
- the video and the contact sheet
- how to publish: attach the video to the post, reply with the links, then quote-post from the second account with one of the quote lines

Name anything left out and why, such as a highlight without a capture or a claim dropped because it was not verified.
