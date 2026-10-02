# Store assets

Screenshots, artwork and listing copy for the App Store (iPhone, iPad, Mac), Google Play and the Microsoft Store. Slides are HTML templates rendered with Playwright from real app captures, so every locale shares one design that follows the folo.is landing page (warm paper, orange gradient).

```
listing/<locale>/        Store copy per listing locale (names, subtitles, descriptions,
                         keywords, release notes, screenshot headlines)
demo-account/            Curated subscriptions per UI locale, capture settings, avatar
promo/                   Release promo video specs (see Release promo video)
src/                     Brand tokens, device frames, slide layouts, automation helpers
scripts/                 Entry points (see below)
captures/                Raw app captures, captures/<ui locale>/<device>/<scene>.png (ignored)
output/                  Rendered store images, output/<store>/<device>/<store locale>/ (ignored)
```

## Locales

`src/locales.ts` maps each listing locale to store locale codes. The five app UI languages (`en`, `zh-Hans`, `zh-Hant`, `ja`, `fr`) get screenshots of a localized app. The other listing locales (`de`, `es`, `es-MX`, `pt-BR`, `ko`, `it`, `ru`) have translated copy and headlines over the English captures.

## Workflow

Run everything from the repository root with `pnpm exec tsx`. The scripts' dependencies are declared in `store-assets/package.json` (a private workspace package); Playwright's Chromium needs a one-time `pnpm exec playwright install chromium`.

1. **Check the copy.** `store-assets/scripts/check-listing.ts [locale...]` validates store length limits and policy rules (no competitor names, no ranking or price claims on Google Play, no URLs in Microsoft Store text).
2. **Switch the demo account's subscriptions** to one UI locale: `store-assets/scripts/demo-account.ts <locale> [--dry-run] [--reset] [--park-videos] [--skip-translation]`. It talks to the signed-in desktop app over CDP (port 9555). `--skip-translation` leaves out the translation demo feed while timelines are captured (for English it is a Chinese feed).
3. **Capture the apps** with the demo account signed in:
   - Desktop: `store-assets/scripts/capture-desktop.ts <locale> [scene,...]` drives an isolated production Folo.app (`FOLO_E2E_USER_DATA_DIR`) over CDP and saves a Mac and a Windows variant of each scene.
   - iOS: `store-assets/scripts/sim-locale.ts <locale> <udid...>` sets the simulator language and a clean status bar, then `store-assets/scripts/capture-ios.ts <locale> <iphone|ipad> <udid> [scene,...]`. Run the `language` scene first and relaunch the app afterwards, since native tab titles only pick up the new language on launch.
   - Android: `store-assets/scripts/capture-android.ts <locale> [serial] [scene,...]` on an emulator (demo mode status bar). Set `FOLO_ANDROID_PACKAGE` to capture a side-by-side build such as `is.follow.playerfix`.
   - `store-assets/scripts/check-captures.ts` lists the captures each UI locale still needs.
4. **Render** with `store-assets/scripts/render.ts [--deck app-store/iphone,...] [--locale en,ja,...] [--allow-missing]`. `--allow-missing` skips slides whose captures are not taken yet, for previews. Each output folder is emptied before it is written.
5. **Check the images** with `store-assets/scripts/check-output.ts`: one file per slide for every store locale, at the store size, without alpha.
6. **Update the repository README images** with `store-assets/scripts/export-readme.ts`: it writes the banner and the English Mac and iPhone posters the README shows as JPEGs to `output/github/readme`. The README links them as GitHub attachments, kept in a comment on [DIYgodLab/debug#1](https://github.com/DIYgodLab/debug/issues/1) rather than in the repository; an attachment only becomes public once the comment holding it is posted.

## Outputs

| Store           | Deck                          | Size                                               |
| --------------- | ----------------------------- | -------------------------------------------------- |
| App Store       | `app-store/iphone`            | 1320 × 2868 (6.9")                                 |
| App Store       | `app-store/ipad`              | 2064 × 2752 (13")                                  |
| App Store       | `app-store/mac`               | 2880 × 1800                                        |
| Google Play     | `google-play/phone`           | 1440 × 2560                                        |
| Google Play     | `google-play/feature-graphic` | 1024 × 500                                         |
| Microsoft Store | `microsoft-store/desktop`     | 3840 × 2160, the Mac posters; captions repeat them |
| Microsoft Store | `microsoft-store/extras`      | 3840 × 2160 super hero art, 300 × 300 store logo   |
| GitHub          | `github/readme`               | 2400 × 1200 README banner, English only            |

## Release promo video

`store-assets/scripts/release-video.ts <spec.json> (--stills <dir> | --video <out.mp4>) [--captures <dir>]` renders the announcement video of a release, 1920 × 1080 at 30 fps, from the captures in the slides' style: an intro with the versions, one scene per highlight (a Mac window, a Mac and a phone, or phones with a callout) and an outro with folo.is. The spec format is documented in the script; `promo/example.json` is the desktop 1.15.0 / mobile 0.5.11 video and uses every layout. `--stills` writes one frame per scene and a contact sheet; both modes print each shot's capture time and report text that wraps or leaves its area, and `--video` (which needs `ffmpeg`) renders nothing until that is fixed. The release flow around it, with the post and the quote line, is `.agents/skills/release-promo`.

## Capture notes

- AI scenes (summary, listen, translate, chat, digest, tasks) need a plan with AI quota on the demo account.
- `demo-account/scenes.json` holds per-locale capture settings: the AI chat prompt, words that keep entries and AI answers out of the shots, the folder the hero, digest and mobile summary open, the translation demo feed, the example AI tasks, and localized names and prompts for the built-in AI shortcuts.
- The desktop script syncs the account's `language` and `actionLanguage` to the capture locale (AI answers, summaries and translations follow `actionLanguage`; settings sync is last-writer-wins, so local patches bump `updated`), localizes the AI shortcuts, creates the example AI tasks for the tasks scene and deletes them right after, and retries chat and digest answers that mention an avoided topic.
- The desktop script seeds the app's locale cache (`follow:locale-<lang>` in localStorage) from the repository's locale files before capturing: the production Electron build leaves some namespaces (the AI settings and chat panel in Traditional Chinese) in English otherwise.
- Hero, digest and the mobile summary open one folder rather than the all-articles timeline, which can take a minute to load for this account. The desktop hero and translate scenes skip entries whose stored AI summary is not in the capture language (checked for CJK locales).
- The listen slides need a build after 0.5.10 on iPad and Android: before 7d4b23bb4 the player bar lived in the JS tab bar, which is hidden on the article screen. For JS-only changes, swap a new Hermes bundle into the existing app instead of rebuilding: on iOS replace `main.jsbundle` in a copy of the simulator `.app`, ad-hoc sign it and `simctl install` it; on Android replace `assets/index.android.bundle` in the installed APK, `zipalign` and sign it with the Expo template `debug.keystore` (the key the local build used) and `adb install -r` it. Both keep the app data and sign-in.
- Mobile translate scenes: on iOS the per-entry "Show Translation" toggle does not fetch every language, so the script switches on the app-wide AI translation setting for the shot and off again, and waits for the entry's translation row in the app's SQLite database; on Android it uses the entry menu and compares pixels to see the translated title (uiautomator keeps reporting the old one).
- The mobile `language` scenes also write the capture language to the account (`src/account.ts`), so builds after 0.5.10, which sync it, produce AI summaries in that language.
- Callouts: the summary and listen scenes save a `<shot>.json` next to the screenshot with the region the slide enlarges (the AI summary card, found by its localized title, and the player bar, found by its testID and its localized stop button). `render.ts` prefers it over the deck's default rectangle, since those elements sit differently per device and entry.
- On iPad, the entry "more" menu opens on a physical tap and its items need a held press (`axe touch --delay 0.2`); on Android, the entry "more" button is found by its localized "More Actions" label, and switching the app language in place offsets the screen until the next launch, so the script relaunches after it. Builds after 0.5.10 expose testIDs (`AXUniqueId` on iOS, `resource-id` on Android), e.g. `timeline-entry-first`, `entry-item-<id>`, `floating-player-bar`.
- Native YouTube feeds (`youtube.com/feeds/videos.xml?playlist_id=UULF…`, the long-form uploads playlist) keep original-language titles and exclude Shorts. The subscription `title` in `feeds.json` replaces their generic "Videos" feed title. A newly added YouTube feed has no thumbnails until its first scheduled refresh; `--park-videos` keeps other locales' YouTube feeds followed (hidden from timelines) until then.
- `demo-account.ts` retries until the account matches the catalog (new feeds can time out while they import); check that its last line reports nothing left to change.
