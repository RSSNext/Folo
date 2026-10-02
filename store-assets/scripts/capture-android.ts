// Captures the Android app on an emulator for one UI locale:
//   tsx store-assets/scripts/capture-android.ts <locale> [serial] [scene,...]
// Set FOLO_ANDROID_PACKAGE to capture a side-by-side build (default is.follow).
// Assumes the demo account is signed in and its subscriptions were switched
// with demo-account.ts. Files land in captures/<locale>/android/<scene>.png.
import { mkdir, readFile } from "node:fs/promises"

import { join } from "pathe"
import sharp from "sharp"

import { setAccountLanguage } from "../src/account"
import type { UiNode } from "../src/android"
import {
  adb,
  back,
  center,
  dumpUi,
  enterDemoMode,
  findNode,
  label,
  screenshot,
  swipe,
  tap,
  tapLabel,
} from "../src/android"
import { mentionsAvoided } from "../src/avoid"
import { around, writeCallout } from "../src/callout"
import { sleep } from "../src/desktop"
import { languageNames, loadLabels } from "../src/labels"
import type { AppUiLocale } from "../src/locales"
import { appUiLocales } from "../src/locales"

const [locale, serialArg, sceneArg] = process.argv.slice(2) as [AppUiLocale, string?, string?]
if (!appUiLocales.includes(locale)) {
  throw new Error("Usage: capture-android.ts <locale> [serial] [scenes]")
}
const serial = serialArg || "emulator-5554"
// A side-by-side build (an `applicationIdSuffix` such as is.follow.playerfix)
// can be captured instead of the store app.
const appPackage = process.env.FOLO_ANDROID_PACKAGE || "is.follow"
const onlyScenes = sceneArg?.split(",")

const root = join(import.meta.dirname, "..")
const outDir = join(root, "captures", locale, "android")
await mkdir(outDir, { recursive: true })
const labels = await loadLabels(locale)
const scenes = JSON.parse(
  await readFile(join(root, "demo-account", "scenes.json"), "utf8"),
) as Record<
  AppUiLocale,
  { translationFeed: string; translationFolder: string; heroFolder: string; avoid: string[] }
>
const config = scenes[locale]
const screen = { width: 1080, height: 2400 }

const save = async (name: string) => {
  await screenshot(serial, join(outDir, `${name}.png`))
  console.log(`captured android/${name}`)
}

// The AI summary card: the smallest full-width group holding the summary
// paragraph and the title row above it.
// The AI summary card: the view group described by the card's title ("AI
// Summary" in the app language). Its summary text is not always exposed as
// text (uiautomator sometimes reports it empty), so readiness is judged by the
// card's height instead: the loading skeleton is short.
const summaryCard = (nodes: UiNode[]) =>
  nodes.find(
    (n) =>
      n.className.endsWith("ViewGroup") &&
      label(n) === labels.aiSummary &&
      n.bounds.width > screen.width * 0.5,
  )
const summaryReady = (nodes: UiNode[]) => {
  const card = summaryCard(nodes)
  if (!card) return false
  const visibleText = nodes.some(
    (n) =>
      n.className.endsWith("TextView") &&
      label(n).length > 70 &&
      n.bounds.height > 40 &&
      n.bounds.y > card.bounds.y &&
      n.bounds.y < card.bounds.y + card.bounds.height,
  )
  return visibleText || card.bounds.height > 360
}
const summaryCardRect = (nodes: UiNode[]) => {
  const card = summaryCard(nodes)
  return card ? around([card.bounds], { x: 6, y: 6 }) : null
}

// The player bar: artwork and title (one pressable) through the stop button.
const playerBarRect = (nodes: UiNode[]) => {
  const stop = nodes.find((n) => label(n) === labels.stopPlayback)
  if (!stop) return null
  const row = stop.bounds.y + stop.bounds.height / 2
  const bar =
    nodes.find((n) => n.id.endsWith("floating-player-bar")) ??
    nodes
      .filter(
        (n) =>
          n.bounds.x < stop.bounds.x &&
          n.bounds.width > screen.width * 0.3 &&
          n.bounds.y < row &&
          n.bounds.y + n.bounds.height > row,
      )
      .sort((a, b) => a.bounds.x - b.bounds.x)[0]
  return around(bar ? [bar.bounds, stop.bounds] : [stop.bounds], { x: 30, y: 24 })
}

// Tabs: Home, Subscriptions, Discover, Settings, in four equal columns.
const tabIndex = { home: 0, subscriptions: 1, discover: 2, settings: 3 } as const
const tapTab = async (tab: keyof typeof tabIndex) => {
  await tap(serial, ((tabIndex[tab] + 0.5) * screen.width) / 4, 2281, 2000)
}

// Views in pager order. uiautomator keeps reporting the first page after the
// pager moves, so views are switched with swipes and verified by the colour of
// the selected pill (Articles orange, Pictures green, Videos red, Audios purple).
const viewIndex = { articles: 0, socialMedia: 1, pictures: 2, videos: 3, audios: 4 } as const
type View = keyof typeof viewIndex
const viewHue: Record<View, [number, number]> = {
  articles: [10, 35],
  socialMedia: [190, 225],
  pictures: [100, 170],
  videos: [340, 375],
  audios: [250, 300],
}
const viewFromHue = (hue: number | null): View | null => {
  if (hue === null) return null
  for (const [view, [min, max]] of Object.entries(viewHue) as [View, [number, number]][]) {
    if ((hue >= min && hue <= max) || (hue + 360 >= min && hue + 360 <= max)) return view
  }
  return null
}

const selectedPillHue = async () => {
  const png = await adb(serial, "exec-out", "screencap", "-p")
  const { data, info } = await sharp(png)
    .extract({ left: 0, top: 262, width: screen.width, height: 80 })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  // Average hue of strongly saturated pixels: the selected pill is the only
  // saturated element in the row.
  let x = 0
  let y = 0
  let count = 0
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i]! / 255
    const g = data[i + 1]! / 255
    const b = data[i + 2]! / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    if (max - min < 0.45 || max < 0.35) continue
    let hue = 0
    if (max === r) hue = ((g - b) / (max - min)) % 6
    else if (max === g) hue = (b - r) / (max - min) + 2
    else hue = (r - g) / (max - min) + 4
    const radians = (hue * 60 * Math.PI) / 180
    x += Math.cos(radians)
    y += Math.sin(radians)
    count++
  }
  if (count < 200) return null
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

// A scanline through the upper half of the pill row splits it into one segment
// per visible pill; the selected pill is the widest.
const pillRowY = 282
const pillSegments = async () => {
  const png = await adb(serial, "exec-out", "screencap", "-p")
  const { data, info } = await sharp(png)
    .extract({ left: 0, top: pillRowY, width: screen.width, height: 1 })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const segments: { x0: number; x1: number }[] = []
  let start = -1
  for (let x = 0; x <= info.width; x++) {
    const i = x * info.channels
    const background =
      x === info.width || (data[i]! > 248 && data[i + 1]! > 248 && data[i + 2]! > 248)
    if (!background && start < 0) start = x
    if (background && start >= 0) {
      if (x - start > 40) segments.push({ x0: start, x1: x })
      start = -1
    }
  }
  return segments
}

// Taps the target view's pill and verifies the switch by the selected pill's
// colour. Swiping the pager instead can land on an inline video in the social
// view and open it full screen.
const tapView = async (view: View, settle = 3000) => {
  for (let attempt = 0; attempt < 8; attempt++) {
    const current = viewFromHue(await selectedPillHue())
    if (current === view) {
      await sleep(settle)
      return
    }
    if (current === null) {
      // Not on a timeline (a player or sheet is covering it).
      await back(serial)
      continue
    }
    const segments = await pillSegments()
    const selected = segments.reduce(
      (widest, s, index) =>
        s.x1 - s.x0 > segments[widest]!.x1 - segments[widest]!.x0 ? index : widest,
      0,
    )
    const target = segments[selected + viewIndex[view] - viewIndex[current]]
    if (target) {
      await tap(serial, (target.x0 + target.x1) / 2, pillRowY + 20, 1500)
    } else {
      // The pill is scrolled out of view; scroll the row towards it.
      const forward = viewIndex[view] > viewIndex[current]
      const [from, to] = forward ? [0.8, 0.2] : [0.2, 0.8]
      await swipe(serial, [screen.width * from, pillRowY], [screen.width * to, pillRowY], 300, 1200)
    }
  }
  throw new Error(`Could not switch to the ${view} view`)
}

// Waits until the list below the view pills shows real rows instead of the
// loading skeleton, then lets images settle.
const waitForContent = async (minRows = 3, timeout = 45_000) => {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const rows = (await dumpUi(serial)).filter(
      (n) => n.className.endsWith("TextView") && n.bounds.y > 380 && label(n).length > 6,
    )
    if (rows.length >= minRows) {
      // Thumbnails keep streaming in after the rows render.
      await sleep(8000)
      return
    }
    await sleep(1500)
  }
  console.warn("content did not finish loading")
}

// Entry headlines are the tall text rows; meta lines are ~42px tall.
const firstEntry = async (): Promise<UiNode | null> => {
  await sleep(1500)
  const all = await dumpUi(serial)
  const nodes = all
    .filter(
      (n) =>
        n.className.endsWith("TextView") &&
        n.bounds.y > 300 &&
        n.bounds.y < screen.height * 0.85 &&
        n.bounds.height >= 60 &&
        label(n).length > 6,
    )
    .sort((a, b) => a.bounds.y - b.bounds.y)
  // Skip entries whose row mentions an avoided topic. A row is a full-width
  // view group whose description joins its texts (feed, title, excerpt).
  const rowText = (t: UiNode) =>
    all
      .filter(
        (n) =>
          n.bounds.width > screen.width * 0.9 &&
          t.bounds.y >= n.bounds.y &&
          t.bounds.y < n.bounds.y + n.bounds.height &&
          label(n).length > label(t).length,
      )
      .sort((a, b) => a.bounds.height - b.bounds.height)
      .map((n) => label(n))[0] ?? label(t)
  return nodes.find((n) => !mentionsAvoided(rowText(n), config.avoid)) ?? nodes[0] ?? null
}

// The entry screen's "more" button. It is looked up by its accessibility
// label: the right-most header control of a timeline is "mark all as read".
const openMoreMenu = async () => {
  const more = await findNode(serial, labels.moreActions, { timeout: 8000 })
  if (!more) throw new Error("More button not found; is an entry open?")
  // The menu animates in; tapping an item too early hits nothing.
  await tap(serial, ...center(more), 2500)
}

const setLanguage = async () => {
  await tapTab("settings")
  const rows = (await dumpUi(serial))
    .filter(
      (n) =>
        n.bounds.width > screen.width * 0.8 &&
        n.bounds.height > 100 &&
        n.bounds.height < 200 &&
        n.bounds.y > 400,
    )
    .sort((a, b) => a.bounds.y - b.bounds.y)
  const general = rows[0]
  if (!general) throw new Error("Settings rows not found")
  await tap(serial, ...center(general), 1800)
  const allNames = Object.values(languageNames).flat()
  const current = await findNode(serial, allNames, { timeout: 8000 })
  if (!current) throw new Error("Language picker not found")
  if (!languageNames[locale].includes(label(current))) {
    await tap(serial, ...center(current), 1500)
    await tapLabel(serial, languageNames[locale], {}, 7000)
  }
  await back(serial)
  // Written after the local change so the account's copy is newer and the app
  // takes its AI language on the next launch.
  await setAccountLanguage(locale)
}

const sceneList: Record<string, () => Promise<void>> = {
  language: setLanguage,
  timeline: async () => {
    await tapTab("home")
    await tapView("articles")
    await tapTab("home")
    await waitForContent()
    await save("timeline")
  },
  summary: async () => {
    // Open one folder from the Subscriptions tab: the all-articles timeline can
    // take a minute to load for this account.
    await tapTab("subscriptions")
    await tapView("articles", 2000)
    await tapLabel(serial, [config.heroFolder], {}, 4000)
    const entry = await firstEntry()
    if (!entry) throw new Error("No entry to open")
    await tap(serial, ...center(entry), 3000)
    // Wait for the AI summary paragraph: a fresh entry's summary can take
    // longer than a fixed delay.
    for (let i = 0; i < 45; i++) {
      if (summaryReady(await dumpUi(serial))) break
      await sleep(2000)
    }
    await sleep(3000)
    await save("summary")
    const card = summaryCardRect(await dumpUi(serial))
    if (card) await writeCallout(join(outDir, "summary.json"), card, screen)
  },
  listen: async () => {
    // Continues from the open entry left by the summary scene. The player shows
    // over the article from builds after 0.5.10 only.
    // Start read-aloud and wait for the player's stop button; a start that
    // times out gets one more try.
    for (let attempt = 1; attempt <= 2; attempt++) {
      await openMoreMenu()
      await tapLabel(serial, [labels.playTts], {}, 4000)
      if (await findNode(serial, [labels.stopPlayback], { timeout: 24_000 })) break
      console.warn(`read-aloud did not start (attempt ${attempt})`)
    }
    // Let the player's title and artwork settle.
    await sleep(2500)
    await save("listen")
    const bar = playerBarRect(await dumpUi(serial))
    if (bar) await writeCallout(join(outDir, "listen.json"), bar, screen)
    const stop = await findNode(serial, [labels.stopPlayback], { timeout: 3000 })
    if (stop) await tap(serial, ...center(stop), 1500)
  },
  translate: async () => {
    // Leave the entry and folder screens the summary scene opened. Back on a
    // tab root would close the app, so only go back while the tab bar is hidden.
    for (let i = 0; i < 3 && !(await findNode(serial, [labels.home], { timeout: 1500 })); i++) {
      await back(serial)
    }
    await tapTab("subscriptions")
    await tapView("articles", 2000)
    // The folder holds only the translation demo feed; tapping its row opens
    // the folder timeline.
    await tapLabel(serial, [config.translationFolder], {}, 4000)
    const entry = await firstEntry()
    if (!entry) throw new Error("No entry in translation feed")
    await tap(serial, ...center(entry), 3000)
    // The toggle sometimes misses a tap. uiautomator keeps reporting the old
    // title, so compare pixels instead: the translated title lengthens the
    // title block and pushes the text below it down. The left half of the
    // screen stays clear of the menu, which opens on the right.
    const titleArea = async () => {
      const png = await adb(serial, "exec-out", "screencap", "-p")
      return sharp(png)
        .extract({ left: 0, top: 480, width: screen.width / 2, height: 500 })
        .removeAlpha()
        .raw()
        .toBuffer()
    }
    const before = await titleArea()
    const translated = async () => {
      const after = await titleArea()
      let diff = 0
      for (let i = 0; i < after.length; i++) diff += Math.abs(after[i]! - before[i]!)
      return diff / after.length > 8
    }
    for (let attempt = 1; attempt <= 3; attempt++) {
      await openMoreMenu()
      await tapLabel(serial, labels.showTranslation, {}, 2000)
      let done = false
      for (let i = 0; i < 10 && !done; i++) {
        await sleep(3000)
        done = await translated()
      }
      if (done) break
      console.warn(`translation did not show (attempt ${attempt})`)
    }
    await sleep(5000)
    await save("translate")
    await back(serial)
    await back(serial)
  },
  pictures: async () => {
    await tapTab("home")
    await tapView("pictures", 3000)
    await waitForContent()
    await save("pictures")
  },
  videos: async () => {
    await tapTab("home")
    await tapView("videos", 3000)
    await waitForContent()
    await save("videos")
  },
  audios: async () => {
    await tapTab("home")
    await tapView("audios", 3000)
    await waitForContent()
    await save("audios")
  },
  discover: async () => {
    await tapTab("discover")
    for (let attempt = 0; attempt < 10; attempt++) {
      const heading = await findNode(serial, [labels.categories], { timeout: 2000 })
      const target = screen.height * 0.125
      if (heading && Math.abs(heading.bounds.y - target) < 30) break
      const delta = heading ? heading.bounds.y - target : screen.height * 0.5
      const step = Math.max(-screen.height * 0.45, Math.min(screen.height * 0.45, delta))
      const from = screen.height * 0.7
      await swipe(serial, [screen.width / 2, from], [screen.width / 2, from - step], 1400, 1200)
    }
    await save("discover")
  },
}

// The app may still be in another language until the language scene runs.
const homeLabels = (await Promise.all(appUiLocales.map((l) => loadLabels(l)))).map((l) => l.home)

// A fresh launch keeps uiautomator dumps in sync: after the Discover tab has
// been shown, dumps keep returning its hierarchy, so Discover runs last.
const relaunch = async () => {
  await adb(serial, "shell", "am", "force-stop", appPackage)
  await adb(serial, "shell", "am", "start", "-n", `${appPackage}/is.follow.MainActivity`)
  // Cold starts can take half a minute; wait until the Home tab has rendered.
  for (let i = 0; i < 40; i++) {
    await sleep(3000)
    if (await findNode(serial, homeLabels, { timeout: 1 })) break
  }
  await sleep(3000)
  await enterDemoMode(serial)
}

await relaunch()
for (const [name, runScene] of Object.entries(sceneList)) {
  if (onlyScenes && !onlyScenes.includes(name)) continue
  try {
    await runScene()
    // Switching the language in place leaves the screen offset under a black
    // strip at the top until the next launch.
    if (name === "language") await relaunch()
  } catch (error) {
    console.error(`scene ${name} failed: ${(error as Error).message}`)
  }
}
