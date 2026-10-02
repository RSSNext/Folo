// Captures the iOS app on a booted simulator for one UI locale:
//   tsx store-assets/scripts/capture-ios.ts <locale> <iphone|ipad> <udid> [scene,...]
// Assumes the demo account is signed in and its subscriptions were switched
// with demo-account.ts. Files land in captures/<locale>/<device>/<scene>.png.
import { execFile } from "node:child_process"
import { mkdir, readFile } from "node:fs/promises"
import { promisify } from "node:util"

import { join } from "pathe"

import { setAccountLanguage } from "../src/account"
import { mentionsAvoided } from "../src/avoid"
import { around, writeCallout } from "../src/callout"
import { sleep } from "../src/desktop"
import type { AxNode } from "../src/ios"
import { describe, find, screenshot, screenSize, swipe, tapLabel, tapPoint } from "../src/ios"
import { languageNames, loadLabels } from "../src/labels"
import type { AppUiLocale } from "../src/locales"
import { appUiLocales } from "../src/locales"

const [locale, device, udid, sceneArg] = process.argv.slice(2) as [
  AppUiLocale,
  "iphone" | "ipad",
  string,
  string?,
]
if (!appUiLocales.includes(locale) || !["iphone", "ipad"].includes(device) || !udid) {
  throw new Error("Usage: capture-ios.ts <locale> <iphone|ipad> <udid> [scenes]")
}
const onlyScenes = sceneArg?.split(",")

const root = join(import.meta.dirname, "..")
const outDir = join(root, "captures", locale, device)
await mkdir(outDir, { recursive: true })
const labels = await loadLabels(locale)
const scenes = JSON.parse(
  await readFile(join(root, "demo-account", "scenes.json"), "utf8"),
) as Record<
  AppUiLocale,
  { translationFeed: string; translationFolder: string; heroFolder: string; avoid: string[] }
>
const config = scenes[locale]
const size = await screenSize(udid)

const save = async (name: string) => {
  await screenshot(udid, join(outDir, `${name}.png`))
  console.log(`captured ${device}/${name}`)
}

// The AI summary card. Builds after 0.5.10 expose it as one element labelled
// "<title>, <summary>"; older ones expose the title and the paragraph.
const summaryCard = (nodes: AxNode[]) =>
  nodes.find(
    (n) =>
      n.type === "GenericElement" &&
      n.label.startsWith(`${labels.aiSummary},`) &&
      n.label.length > 70 &&
      n.frame.width > size.width * 0.3,
  )
const summaryParagraph = (nodes: AxNode[]) => {
  const title = nodes.find((n) => n.type === "StaticText" && n.label === labels.aiSummary)
  if (!title) return null
  return nodes
    .filter((n) => n.type === "StaticText" && n.label.length > 70 && n.frame.y > title.frame.y)
    .sort((a, b) => a.frame.y - b.frame.y)[0]
}
const summaryCardRect = (nodes: AxNode[]) => {
  const card = summaryCard(nodes)
  if (card) return around([card.frame], { x: 6, y: 6 })
  const title = nodes.find((n) => n.type === "StaticText" && n.label === labels.aiSummary)
  const paragraph = summaryParagraph(nodes)
  if (!title || !paragraph) return null
  return around([title.frame, paragraph.frame], { x: 14, y: 14 })
}

// The player bar: artwork and title (one pressable) through the stop button.
const playerBarRect = (nodes: AxNode[]) => {
  const bar = nodes.find((n) => n.id === "floating-player-bar" || n.id === "player-tab-bar")
  const stop = nodes.find((n) => n.label === labels.stopPlayback)
  if (!bar || !stop) return null
  return around([bar.frame, stop.frame], { x: 14, y: 10 })
}

// The App Store rating sheet is drawn by another process, so it never shows up
// in the accessibility tree; tap its "Not Now" button by position instead.
const dismissRatingSheet = () =>
  tapPoint(
    udid,
    size.width / 2,
    size.height * (device === "ipad" ? 0.586 : 0.632),
    1500,
    "simulator",
  )

const tabBar = async () =>
  (await describe(udid))
    .filter((n) => n.type === "RadioButton" && n.frame.y > size.height * 0.8)
    .sort((a, b) => a.frame.x - b.frame.x)

// Tab bar items in order: Home, Subscriptions, Discover, Settings. iPhone on
// iOS 26+ uses the native tab bar; iPad draws a JS tab bar that is not exposed
// to accessibility, so it is tapped by position.
const tapTab = async (index: number) => {
  if ((await describe(udid)).length < 6) await dismissRatingSheet()
  const tabs = await tabBar()
  const tab = tabs[index]
  if (tabs.length >= 4 && tab) {
    await tapPoint(
      udid,
      tab.frame.x + tab.frame.width / 2,
      tab.frame.y + tab.frame.height / 2,
      2000,
    )
    return
  }
  await tapPoint(udid, ((index + 0.5) * size.width) / 4, size.height - 35, 2000)
}

// Native menus: on iPhone simulator-level taps open the "more" menu and pick
// its items. On iPad the button opens on a physical tap, an item needs a held
// press, and the menu stays open until a tap outside it.
const menuStyle = device === "ipad" ? "physical" : "simulator"
const chooseMenuItem = async (label: string, settle: number) => {
  await tapLabel(udid, [label], { style: device === "ipad" ? "held" : "simulator" }, settle)
  if (device === "ipad" && (await find(udid, [label], { timeout: 500 }))) {
    await tapPoint(udid, 40, size.height * 0.5, 1200, "physical")
  }
}

// The entry menu's "Show Translation" toggle sometimes misses a tap. The app
// stores every translation it fetches in its SQLite database, so a new row in
// the capture language tells whether the toggle took.
const exec = promisify(execFile)
const translationLanguage: Record<AppUiLocale, string> = {
  en: "en",
  "zh-Hans": "zh-CN",
  "zh-Hant": "zh-TW",
  ja: "ja",
  fr: "fr-FR",
}
// Rows stored for the entry with this title in the capture language.
const translationRows = async (title: string) => {
  const { stdout: container } = await exec("xcrun", [
    "simctl",
    "get_app_container",
    udid,
    "is.follow",
    "data",
  ])
  const db = join(container.trim(), "Documents/SQLite/follow.db")
  const { stdout } = await exec("sqlite3", [
    "-readonly",
    `file:${db}?mode=ro`,
    `select count(*) from translations t join entries e on e.id = t.entry_id where e.title = '${title.replaceAll("'", "''")}' and t.language = '${translationLanguage[locale]}'`,
  ])
  return Number(stdout.trim())
}

// Header buttons of a pushed screen: back on the left, the "more" menu on the right.
const headerButton = async (side: "left" | "right") => {
  const nodes = (await describe(udid)).filter(
    (n) =>
      n.frame.y < 140 &&
      n.frame.y > 40 &&
      n.frame.width >= 20 &&
      n.frame.width < 80 &&
      n.frame.height >= 20 &&
      n.frame.height < 80 &&
      (n.type === "Button" || n.type === "GenericElement"),
  )
  const sorted = nodes.sort((a, b) => a.frame.x + a.frame.width - (b.frame.x + b.frame.width))
  const node = side === "left" ? sorted[0] : sorted.at(-1)
  if (!node) throw new Error(`No ${side} header button`)
  // The right-hand "more" button is a native menu button.
  await tapPoint(
    udid,
    node.frame.x + node.frame.width / 2,
    node.frame.y + node.frame.height / 2,
    // The menu animates in; an item tapped too early is dropped.
    side === "right" ? 2800 : 1500,
    side === "right" ? menuStyle : "physical",
  )
}

// The edge swipe goes back on iPhone; on iPad it does nothing on the entry
// screen, so tap the header's back button there (when a pushed screen has one).
const goBack = async () => {
  if (device === "ipad") {
    const back = (await describe(udid))
      .filter(
        (n) =>
          n.frame.y > 30 &&
          n.frame.y < 90 &&
          n.frame.x < 30 &&
          n.frame.width >= 20 &&
          n.frame.width < 60 &&
          (n.type === "Button" || n.type === "GenericElement"),
      )
      .sort((a, b) => a.frame.x - b.frame.x)[0]
    if (back) await tapPoint(udid, ...center(back), 1500)
    return
  }
  await swipe(udid, [2, size.height * 0.45], [size.width * 0.8, size.height * 0.45], 0.3, 1500)
}

const center = (n: AxNode) =>
  [n.frame.x + n.frame.width / 2, n.frame.y + n.frame.height / 2] as const

// First entry headline on screen: headlines are the tall StaticText rows
// (meta lines such as the feed name and time are 16pt tall).
const firstEntry = async () => {
  await sleep(1500)
  const nodes = await describe(udid)
  const texts = nodes
    .filter(
      (n) =>
        n.type === "StaticText" &&
        n.frame.y > 110 &&
        n.frame.y < size.height * 0.8 &&
        n.frame.height >= 22 &&
        n.label.length > 6,
    )
    .sort((a, b) => a.frame.y - b.frame.y)
  // Skip entries whose row (feed, title, excerpt) mentions an avoided topic.
  // Timeline rows carry testIDs in builds after 0.5.10.
  const rows = nodes
    .filter((n) => n.id === "timeline-entry-first" || n.id.startsWith("entry-item-"))
    .sort((a, b) => a.frame.y - b.frame.y)
  if (rows.length > 0) {
    for (const row of rows) {
      const inRow = (n: AxNode) =>
        n.frame.y >= row.frame.y && n.frame.y < row.frame.y + row.frame.height
      const rowText = nodes
        .filter((n) => n.type === "StaticText" && inRow(n))
        .map((n) => n.label)
        .join(" ")
      const title = texts.find((t) => inRow(t))
      if (title && !mentionsAvoided(rowText, config.avoid)) return title
    }
  }
  // Older builds: rows are groups spanning almost the whole list width.
  const wideRows = nodes.filter(
    (n) => n.type === "Group" && n.frame.width > size.width * 0.85 && n.frame.height > 50,
  )
  const rowText = (t: AxNode) => {
    const row = wideRows
      .filter((r) => t.frame.y >= r.frame.y && t.frame.y < r.frame.y + r.frame.height)
      .sort((a, b) => a.frame.height - b.frame.height)[0]
    if (!row) return t.label
    return nodes
      .filter(
        (n) =>
          n.type === "StaticText" &&
          n.frame.y >= row.frame.y &&
          n.frame.y < row.frame.y + row.frame.height,
      )
      .map((n) => n.label)
      .join(" ")
  }
  return texts.find((t) => !mentionsAvoided(rowText(t), config.avoid)) ?? texts[0] ?? null
}

// Opens Settings → General from any tab root.
const openGeneralSettings = async () => {
  await tapTab(3)
  const rows = (await describe(udid))
    .filter(
      (n) =>
        n.type === "GenericElement" &&
        // iPad settings rows sit in a centred column.
        n.frame.width > size.width * (device === "ipad" ? 0.6 : 0.8) &&
        n.frame.height > 40 &&
        n.frame.height < 70,
    )
    .sort((a, b) => a.frame.y - b.frame.y)
  const general = rows[0]
  if (!general) throw new Error("Settings rows not found")
  await tapPoint(udid, ...center(general), 2500)
}

const setLanguage = async () => {
  // Leave any pushed screen first; the back gesture is a no-op on tab roots.
  await goBack()
  await goBack()
  await openGeneralSettings()
  // The picker is a native menu button whose title is not exposed to
  // accessibility: it is the first wide button on the General screen.
  const picker = (await describe(udid))
    .filter((n) => n.type === "Button" && n.frame.width > 100 && n.frame.y < size.height * 0.3)
    .sort((a, b) => a.frame.y - b.frame.y)[0]
  if (!picker) throw new Error("Language picker not found")
  await tapPoint(udid, ...center(picker), 1500, "simulator")
  await tapLabel(udid, languageNames[locale], { type: "Button", style: "simulator" }, 8000)
  await goBack()
  // Written after the local change so the account's copy is newer and the app
  // takes its AI language on the next launch.
  await setAccountLanguage(locale)
}

// Turns the app-wide "AI Translation" setting on or off. The entry menu's
// per-entry toggle does not fetch translations for every language in this
// build; the app-wide setting does.
const setTranslationSetting = async (on: boolean) => {
  await goBack()
  await goBack()
  await openGeneralSettings()
  const label = await find(udid, [labels.aiTranslation], { type: "StaticText", timeout: 6000 })
  if (!label) throw new Error("AI translation setting not found")
  const y = label.frame.y + label.frame.height / 2
  const nodes = await describe(udid)
  const toggle = nodes.find(
    (n) => n.type === "CheckBox" && Math.abs(n.frame.y + n.frame.height / 2 - y) < 30,
  )
  if (toggle) {
    if ((toggle.value === "1") !== on) await tapPoint(udid, ...center(toggle), 1500)
  } else {
    // iPad does not expose the switches at their on-screen position; the
    // switch sits at the right end of the label's row.
    const row = nodes
      .filter(
        (n) =>
          n.frame.width > size.width * 0.6 &&
          n.frame.y <= label.frame.y &&
          n.frame.y + n.frame.height >= label.frame.y + label.frame.height,
      )
      .sort((a, b) => a.frame.height - b.frame.height)[0]
    const right = row ? row.frame.x + row.frame.width : size.width * 0.87
    await tapPoint(udid, right - 45, y, 1500)
  }
  await goBack()
}

const sceneList: Record<string, () => Promise<void>> = {
  language: setLanguage,
  timeline: async () => {
    await tapTab(0)
    await tapLabel(udid, [labels.articles], { prefix: true }, 2500)
    await tapTab(0)
    await sleep(2500)
    await save("timeline")
  },
  summary: async () => {
    // Open one folder from the Subscriptions tab: the all-articles timeline can
    // take a minute to load for this account.
    await tapTab(1)
    await tapLabel(udid, [labels.articles], { prefix: true }, 2000)
    await tapLabel(udid, [config.heroFolder], { type: "StaticText" }, 4000)
    const entry = await firstEntry()
    if (!entry) throw new Error("No entry to open")
    await tapPoint(udid, ...center(entry), 3000)
    // Wait for the AI summary paragraph: a fresh entry's summary can take
    // longer than a fixed delay.
    for (let i = 0; i < 45; i++) {
      const nodes = await describe(udid)
      // CJK summaries run ~100 characters; "Generating…" placeholders are short.
      if (summaryCard(nodes) ?? summaryParagraph(nodes)) break
      await sleep(2000)
    }
    await sleep(3000)
    await save("summary")
    const card = summaryCardRect(await describe(udid))
    if (card) await writeCallout(join(outDir, "summary.json"), card, size)
  },
  listen: async () => {
    // Continues from the open entry left by the summary scene. On iPad the
    // player shows over the article from builds after 0.5.10 only.
    // Start read-aloud and wait for the player's stop button; a start that
    // times out gets one more try.
    const playerShown = async () => {
      for (let i = 0; i < 12; i++) {
        if ((await describe(udid)).some((n) => n.label === labels.stopPlayback)) return true
        await sleep(2000)
      }
      return false
    }
    for (let attempt = 1; attempt <= 2; attempt++) {
      await headerButton("right")
      await chooseMenuItem(labels.playTts, 4000)
      if (await playerShown()) break
      console.warn(`read-aloud did not start (attempt ${attempt})`)
    }
    await sleep(2500)
    await save("listen")
    // Stop playback with the player's stop button, found by its label; older
    // builds leave it unlabelled, so fall back to the bar's last button.
    const nodes = await describe(udid)
    const bar = playerBarRect(nodes)
    if (bar) await writeCallout(join(outDir, "listen.json"), bar, size)
    const stop =
      nodes.find((n) => n.label === labels.stopPlayback) ??
      nodes
        .filter(
          (n) =>
            n.frame.y > size.height * 0.75 && n.frame.y < size.height * 0.95 && n.frame.width < 70,
        )
        .sort((a, b) => a.frame.x - b.frame.x)
        .at(-1)
    if (stop) await tapPoint(udid, ...center(stop), 1000)
    await goBack()
  },
  translate: async () => {
    await setTranslationSetting(true)
    try {
      await tapTab(1)
      await tapLabel(udid, [labels.articles], { prefix: true }, 2000)
      // Expand the folder with its chevron unless it is open already; tapping the
      // name opens the folder timeline.
      if (
        !(await find(udid, [config.translationFeed], {
          prefix: true,
          type: "StaticText",
          timeout: 1500,
        }))
      ) {
        const folder = await find(udid, [config.translationFolder], { type: "StaticText" })
        if (!folder) throw new Error(`Folder ${config.translationFolder} not found`)
        await tapPoint(udid, folder.frame.x - 20, folder.frame.y + folder.frame.height / 2, 1500)
      }
      await tapLabel(udid, [config.translationFeed], { prefix: true, type: "StaticText" }, 3000)
      const entry = await firstEntry()
      if (!entry) throw new Error("No entry in translation feed")
      await tapPoint(udid, ...center(entry), 3000)
      // The app stores each translation it fetches; wait for this entry's.
      for (let i = 0; i < 15 && (await translationRows(entry.label)) === 0; i++) await sleep(2000)
      // Let the bilingual title and body render.
      await sleep(6000)
      await save("translate")
    } finally {
      await setTranslationSetting(false)
    }
  },
  pictures: async () => {
    await tapTab(0)
    await tapLabel(udid, [labels.pictures], { prefix: true }, 6000)
    await save("pictures")
  },
  videos: async () => {
    await tapTab(0)
    await tapLabel(udid, [labels.videos], { prefix: true }, 6000)
    await save("videos")
  },
  discover: async () => {
    await tapTab(2)
    // Bring the Categories grid to the top; off-screen nodes report negative y.
    for (let attempt = 0; attempt < 8; attempt++) {
      const heading = await find(udid, [labels.categories], { type: "StaticText", timeout: 3000 })
      if (!heading) throw new Error("Categories heading not found")
      const delta = heading.frame.y - size.height * 0.125
      if (Math.abs(delta) < 12) break
      const step = Math.max(-size.height * 0.5, Math.min(size.height * 0.5, delta))
      const from = size.height * 0.7
      await swipe(udid, [size.width / 2, from], [size.width / 2, from - step], 1.4, 1200)
    }
    await save("discover")
  },
  audios: async () => {
    await tapTab(0)
    await tapLabel(udid, [labels.audios], { prefix: true }, 6000)
    await save("audios")
  },
  // Not a shot: makes sure the app-wide AI translation the translate scene
  // switches on is off again, e.g. after an interrupted run.
  translationOff: async () => {
    await setTranslationSetting(false)
  },
}

// System sheets that can pop up mid-run: the App Store rating prompt and the
// "Save Password?" sheet. Both offer "Not Now" in every UI language we use.
const notNow = ["Not Now", "以后", "稍後", "今はしない", "Plus tard", "Pas maintenant", "今後"]
const dismissSystemPrompts = async () => {
  const node = await find(udid, notNow, { timeout: 500 })
  if (node) await tapPoint(udid, ...center(node), 1200, "simulator")
}

for (const [name, run] of Object.entries(sceneList)) {
  if (onlyScenes && !onlyScenes.includes(name)) continue
  try {
    await dismissSystemPrompts()
    await run()
  } catch (error) {
    console.error(`scene ${name} failed: ${(error as Error).message}`)
  }
}
