// Captures desktop screens from the isolated Folo instance for one UI locale:
//   tsx store-assets/scripts/capture-desktop.ts <locale> [scene,...]
// Each scene is saved twice: captures/<locale>/mac/<scene>.png and a Windows
// variant at captures/<locale>/windows/<scene>.png.
import { mkdir, readFile } from "node:fs/promises"

import { join } from "pathe"

import type { CdpSession } from "../src/cdp"
import { apiRequest, connectCdp } from "../src/cdp"
import {
  appLanguage,
  applyWindowsChrome,
  capture,
  click,
  navigate,
  prepareSession,
  pressKey,
  reload,
  revertWindowsChrome,
  sleep,
  typeText,
  updateAccountSettings,
  updateSettings,
  waitFor,
} from "../src/desktop"
import type { AppUiLocale } from "../src/locales"
import { appUiLocales } from "../src/locales"

const locale = process.argv[2] as AppUiLocale
if (!appUiLocales.includes(locale))
  throw new Error(`Usage: capture-desktop.ts <${appUiLocales.join("|")}> [scenes]`)
const onlyScenes = process.argv[3]?.split(",")

interface ShortcutText {
  name: string
  prompt: string
}

interface TaskSpec {
  name: string
  prompt: string
  schedule: { type: "daily"; hour: number } | { type: "weekly"; dayOfWeek: number; hour: number }
}

const root = join(import.meta.dirname, "..")
const scenesConfig = JSON.parse(
  await readFile(join(root, "demo-account", "scenes.json"), "utf8"),
) as Record<
  AppUiLocale,
  {
    chatPrompt: string
    avoid: string[]
    tasks: TaskSpec[]
    shortcuts: Record<string, ShortcutText>
    heroFolder: string
  }
>
const config = scenesConfig[locale]
const catalog = JSON.parse(await readFile(join(root, "demo-account", "feeds.json"), "utf8")) as {
  translation: Record<AppUiLocale, { url: string }>
}

const macDir = join(root, "captures", locale, "mac")
const windowsDir = join(root, "captures", locale, "windows")
await mkdir(macDir, { recursive: true })
await mkdir(windowsDir, { recursive: true })

const session = await connectCdp()

const closeOverlays = async () => {
  await pressKey(session, "Escape")
  await sleep(300)
  await pressKey(session, "Escape")
  await sleep(500)
}

const captureBoth = async (name: string) => {
  await capture(session, join(macDir, `${name}.png`))
  await applyWindowsChrome(session)
  await sleep(600)
  await capture(session, join(windowsDir, `${name}.png`))
  await revertWindowsChrome(session)
  console.log(`captured ${name}`)
}

// First entry in the visible list that has a thumbnail and no avoided words.
// Entries in the visible list that have a thumbnail and no avoided words.
const pickEntries = (session: CdpSession) =>
  session.evaluate<string[]>(`(() => {
    const avoid = ${JSON.stringify(config.avoid)}.map((w) => w.toLowerCase())
    return [...document.querySelectorAll("[data-entry-id]")]
      .filter((item) => !avoid.some((w) => item.innerText.toLowerCase().includes(w)))
      .filter((item) => item.querySelector("img"))
      .map((item) => item.getAttribute("data-entry-id"))
  })()`)

// Settings tabs by position (General, Appearance, AI, Plan, Integration, ...),
// so the same scene works in every UI language.
const openSettingsTab = async (index: number) => {
  await closeOverlays()
  await click(
    session,
    `[...document.querySelector("[data-testid=subscription-discover-trigger]").parentElement.querySelectorAll("button")].at(-1)`,
    1200,
  )
  // "Preferences" is the menu item carrying the ⌘, shortcut.
  await click(
    session,
    `[...document.querySelectorAll("[role=menuitem]")].find((m) => m.innerText.trim().endsWith(","))`,
    1500,
  )
  await click(
    session,
    `(() => {
      const candidates = [...document.querySelectorAll("[role=dialog] button, [role=dialog] a")].filter((e) => {
        const r = e.getBoundingClientRect()
        return r.width > 100 && r.height > 20 && r.height < 48
      })
      // The tab list is the left-most column of same-width rows.
      const left = Math.min(...candidates.map((e) => e.getBoundingClientRect().left))
      return candidates.filter((e) => Math.abs(e.getBoundingClientRect().left - left) < 2)[${index}]
    })()`,
    2000,
  )
}

// Example AI tasks for the AI settings screen, scheduled from tomorrow.
const createDemoTasks = async () => {
  const ids: string[] = []
  for (const task of config.tasks) {
    const time = new Date()
    time.setDate(time.getDate() + 1)
    time.setHours(task.schedule.hour, 0, 0, 0)
    const schedule =
      task.schedule.type === "daily"
        ? { type: "daily", timeOfDay: time.toISOString() }
        : { type: "weekly", dayOfWeek: task.schedule.dayOfWeek, timeOfDay: time.toISOString() }
    const res = await apiRequest<{ code: number; message?: string; data?: { id: string } }>(
      session,
      "POST",
      "/ai/task",
      {
        name: task.name,
        prompt: task.prompt,
        isEnabled: true,
        schedule,
        options: { notifyChannels: [] },
      },
    )
    if (res.code !== 0 || !res.data) throw new Error(`Could not create task: ${res.message}`)
    ids.push(res.data.id)
  }
  return ids
}

const captureTasks = async () => {
  await openSettingsTab(2)
  // Bring the task list up: the "New Task" button sits next to the section title.
  await session.evaluate(`(() => {
    const button = [...document.querySelectorAll("[role=dialog] button")].find((b) => /New Task|新建任务|新增任務|新規タスク|Nouvelle tâche/i.test(b.textContent || ""))
    button?.scrollIntoView({ block: "start" })
    button?.closest("[class*=overflow]")?.scrollBy(0, -140)
  })()`)
  await sleep(1200)
  await captureBoth("tasks")
  await closeOverlays()
}

// The send button turns into a stop button while an answer streams, the
// "Thinking" phase included; wait for it to appear and then to go away.
const waitForStreamEnd = async () => {
  const streaming = `!!document.querySelector("i[class*=stop-circle]")`
  for (let i = 0; i < 40 && !(await session.evaluate<boolean>(streaming)); i++) await sleep(500)
  for (let i = 0; i < 300 && (await session.evaluate<boolean>(streaming)); i++) await sleep(1000)
  await sleep(2500)
}

// The chat follows the stream to the bottom; scroll back so the question and
// the start of the answer are in view. The message list is the nearest
// scrollable element around the chat input, which also finds the floating
// panel the timeline summary opens in. Returns the conversation text.
const scrollChatToTop = async () => {
  const text = await session.evaluate<string>(`(() => {
    const isScroller = (e) => /auto|scroll/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 40
    let root = document.querySelector("[contenteditable=true], textarea")
    while (root && (root = root.parentElement)) {
      const scroller = [...root.querySelectorAll("*")].filter(isScroller).sort((a, b) => b.scrollHeight - a.scrollHeight)[0]
      if (scroller) {
        scroller.scrollTop = 0
        return scroller.innerText
      }
    }
    return ""
  })()`)
  await sleep(1200)
  return text
}

// Whole-word match for Latin words ("war" must not hit "software"), substring
// match for CJK. AI answers often say "AI war" figuratively, so war words only
// count in entry titles.
const warWords = new Set(["war", "guerre", "战争", "戰爭", "戦争"])
const mentionsAvoided = (text: string) =>
  config.avoid
    .filter((word) => !warWords.has(word))
    .some((word) =>
      /^[\u0020-\u024F]+$/.test(word)
        ? new RegExp(`(?<![\\p{L}\\p{N}])${word}(?![\\p{L}\\p{N}])`, "iu").test(text)
        : text.includes(word),
    )

// AI answers vary between runs; retry when one drifts into an avoided topic.
const generateCleanAnswer = async (generate: () => Promise<void>, attempts = 3) => {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    await generate()
    await waitForStreamEnd()
    const text = await scrollChatToTop()
    if (!mentionsAvoided(text)) return
    console.warn(`answer ${attempt}/${attempts} mentions an avoided topic`)
  }
}

// Hero and digest read one folder: the all-articles timeline query can take a
// minute on the server for an account with a sparse timeline.
const heroFolder = `folder-${encodeURIComponent(config.heroFolder)}`

// The production desktop build does not load every i18n namespace for every
// language (zh-TW shows the AI settings and chat panel in English). Seed the
// app's locale cache (`follow:locale-<lang>`, read at startup) with the
// repository's locale files so every screen renders fully localized.
// Namespaces as in apps/desktop/layer/renderer/src/@types/constants.ts.
const seedLocaleCache = async (lang: string) => {
  if (lang === "en") return
  const resources: Record<string, unknown> = {}
  for (const ns of ["common", "lang", "errors", "app", "settings", "shortcuts", "ai"]) {
    const file = join(root, "..", "locales", ns, `${lang}.json`)
    resources[ns] = JSON.parse(await readFile(file, "utf8").catch(() => "{}"))
  }
  await session.evaluate(
    `localStorage.setItem(${JSON.stringify(`follow:locale-${lang}`)}, ${JSON.stringify(JSON.stringify(resources))})`,
  )
}

// Opens the first of the listed entries whose AI summary renders in the
// capture language. The app keeps summaries on the device, and one stored by
// an earlier run can be in another language; CJK summaries are easy to check.
const cjkLocale = locale === "zh-Hans" || locale === "zh-Hant" || locale === "ja"
const openEntryWithSummary = async (timeline: string) => {
  await navigate(session, `#/timeline/articles/${timeline}/pending`, 6000)
  const ids = (await pickEntries(session)).slice(0, 4)
  if (ids.length === 0) throw new Error(`No suitable entry in ${timeline}`)
  for (const id of ids) {
    await navigate(session, `#/timeline/articles/${timeline}/${id}`, 3000)
    await waitFor(session, summaryReady, 60_000)
    const summary = await session.evaluate<string>(`(() => {
      const card = [...document.querySelectorAll("div")].find((d) => /AI/.test(d.innerText.slice(0, 40)) && d.innerText.length > 180 && d.querySelector("svg"))
      return card ? card.innerText.split("\\n").slice(1).join(" ") : ""
    })()`)
    if (!cjkLocale || /[\u3040-\u30FF\u4E00-\u9FFF]{8}/.test(summary)) return id
    console.warn(`summary of ${id} is not in the capture language; trying the next entry`)
  }
  return ids.at(-1)!
}

const summaryReady = `[...document.querySelectorAll("div")].some((d) => /AI/.test(d.innerText.slice(0, 40)) && d.innerText.length > 180 && d.querySelector("svg"))`

const scenes: Record<string, () => Promise<void>> = {
  hero: async () => {
    await openEntryWithSummary(heroFolder)
    await sleep(1500)
    await captureBoth("hero")
  },
  chat: async () => {
    await generateCleanAnswer(async () => {
      await navigate(session, "#/ai", 2500)
      // Start from an empty conversation so the prompt is the first message.
      await click(
        session,
        `[...document.querySelectorAll("button")].find((b) => b.getBoundingClientRect().top < 60 && b.querySelector("i[class*=edit]"))`,
        1500,
      ).catch(() => undefined)
      await click(session, `document.querySelector("[contenteditable=true], textarea")`, 500)
      await typeText(session, config.chatPrompt)
      await sleep(500)
      await pressKey(session, "Enter")
      await sleep(8000)
    })
    await captureBoth("chat")
  },
  digest: async () => {
    await generateCleanAnswer(async () => {
      await closeOverlays()
      await navigate(session, `#/timeline/articles/${heroFolder}/pending`, 6000)
      // "Summarize the current timeline" in the empty entry pane; it always
      // starts a new chat.
      await click(
        session,
        `[...document.querySelectorAll("button")].find((b) => b.querySelector("i[class*=paint-brush-ai]"))`,
        8000,
      )
    })
    await captureBoth("digest")
  },
  translate: async () => {
    await updateSettings(session, { general: { translation: true, translationMode: "bilingual" } })
    await reload(session)
    const subscriptions = await apiRequest<{ data: { feedId: string; feeds?: { url: string } }[] }>(
      session,
      "GET",
      "/subscriptions",
    )
    const feedId = subscriptions.data.find(
      (s) => s.feeds?.url === catalog.translation[locale].url,
    )?.feedId
    if (!feedId)
      throw new Error("Translation demo feed is not subscribed; run demo-account.ts first")
    const id = await openEntryWithSummary(feedId)
    // A first translation of a long article can take a minute.
    const translated = `!!window.store_translation?.getState?.().data?.[${JSON.stringify(id)}]?.[${JSON.stringify(appLanguage[locale])}]?.title`
    if (!(await waitFor(session, translated, 120_000))) {
      console.warn("translation did not arrive")
    }
    await sleep(5000)
    await captureBoth("translate")
    await updateSettings(session, { general: { translation: false } })
    await reload(session)
  },
  pictures: async () => {
    await navigate(session, "#/timeline/pictures/all/pending", 6000)
    await captureBoth("pictures")
  },
  videos: async () => {
    await navigate(session, "#/timeline/videos/all/pending", 6000)
    await captureBoth("videos")
  },
  tasks: async () => {
    const taskIds = await createDemoTasks()
    try {
      await captureTasks()
    } finally {
      // Remove the demo tasks right away so they never run on schedule.
      for (const id of taskIds) await apiRequest(session, "DELETE", `/ai/task/${id}`)
    }
  },
  integrations: async () => {
    await openSettingsTab(4)
    await captureBoth("integrations")
    await closeOverlays()
  },
  appearance: async () => {
    await openSettingsTab(1)
    await captureBoth("appearance")
    await closeOverlays()
  },
}

try {
  await prepareSession(session)
  await seedLocaleCache(appLanguage[locale])
  // The AI chat answers in the account's synced action language; with the
  // default it follows the prompt, and the built-in shortcuts are English.
  // Keep the synced language in step too, or the sync pushes another device's
  // language back into this window.
  await updateAccountSettings(session, "general", {
    language: appLanguage[locale],
    actionLanguage: appLanguage[locale],
  })
  // The built-in AI shortcuts are English; give the chips and prompts the
  // capture language.
  const aiSettings = await apiRequest<{
    settings?: { ai?: { shortcuts?: { id: string; name: string; prompt: string }[] } }
  }>(session, "GET", "/settings?tab=ai")
  const shortcuts = (aiSettings.settings?.ai?.shortcuts ?? []).map((shortcut) => ({
    ...shortcut,
    ...config.shortcuts[shortcut.id],
  }))
  if (shortcuts.length > 0) await updateAccountSettings(session, "ai", { shortcuts })
  // The app does not pull the AI tab back on reload, so patch the local copy too.
  await session.evaluate(`(() => {
    const ai = JSON.parse(localStorage.getItem("follow:ai") || "{}")
    const texts = ${JSON.stringify(config.shortcuts)}
    ai.shortcuts = (ai.shortcuts || []).map((s) => ({ ...s, ...texts[s.id] }))
    localStorage.setItem("follow:ai", JSON.stringify({ ...ai, updated: Date.now() }))
  })()`)
  await updateSettings(session, {
    // Translation and summaries target the action language; "default" left
    // French articles untranslated.
    general: {
      language: appLanguage[locale],
      actionLanguage: appLanguage[locale],
      translation: false,
    },
    ui: { feedColWidth: 256, entryColWidth: 420, opaqueSidebar: false },
  })
  await reload(session)
  for (const [name, run] of Object.entries(scenes)) {
    if (onlyScenes && !onlyScenes.includes(name)) continue
    try {
      await run()
    } catch (error) {
      console.error(`scene ${name} failed: ${(error as Error).message}`)
      await closeOverlays()
    }
  }
} finally {
  session.close()
}
