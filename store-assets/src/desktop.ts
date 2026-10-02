import { readFile, writeFile } from "node:fs/promises"

import { join } from "pathe"
import type { OverlayOptions } from "sharp"
import sharp from "sharp"

import type { CdpSession } from "./cdp"
import { apiRequest } from "./cdp"
import type { AppUiLocale } from "./locales"

// Desktop captures render the renderer at 1280 x 800 CSS px with a 2.25 device
// scale, which yields 2880 x 1800 (the Mac App Store size) and keeps UI text
// large enough to read once the window is framed on a store canvas.
export const viewport = { width: 1280, height: 800, deviceScaleFactor: 2.25 }

export const appLanguage: Record<AppUiLocale, string> = {
  en: "en",
  "zh-Hans": "zh-CN",
  "zh-Hant": "zh-TW",
  ja: "ja",
  fr: "fr-FR",
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const prepareSession = async (session: CdpSession) => {
  await session.send("Page.bringToFront")
  // Occluded windows stop animating, which would freeze fade-ins half way.
  await session.send("Emulation.setFocusEmulationEnabled", { enabled: true })
  await session.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  })
  await session.send("Emulation.setDeviceMetricsOverride", { ...viewport, mobile: false })
}

// Settings live in localStorage (follow:general, follow:ui); a reload applies them.
// Settings sync is last-writer-wins on `updated`, so bump it or the account's
// synced settings overwrite the patch on reload.
export const updateSettings = async (
  session: CdpSession,
  patch: { general?: Record<string, unknown>; ui?: Record<string, unknown> },
) => {
  await session.evaluate(`(() => {
    const merge = (key, patch) => {
      if (Object.keys(patch).length === 0) return
      const current = JSON.parse(localStorage.getItem(key) || "{}")
      localStorage.setItem(key, JSON.stringify({ ...current, ...patch, updated: Date.now() }))
    }
    merge("follow:general", ${JSON.stringify(patch.general ?? {})})
    merge("follow:ui", ${JSON.stringify(patch.ui ?? {})})
  })()`)
}

// Patches one tab of the account's synced settings, the copy the server and
// other devices read. The server merges the patch into the stored tab.
export const updateAccountSettings = async (
  session: CdpSession,
  tab: "general" | "ai" | "appearance",
  patch: Record<string, unknown>,
) => {
  const res = await apiRequest<{ code: number; message?: string }>(
    session,
    "PATCH",
    `/settings/${tab}`,
    patch,
  )
  if (res.code !== 0) throw new Error(`Could not update ${tab} settings: ${res.message}`)
}

export const reload = async (session: CdpSession) => {
  await session.send("Page.reload")
  await sleep(8000)
  await prepareSession(session)
}

export const navigate = async (session: CdpSession, hash: string, settle = 2500) => {
  await session.evaluate(`location.hash = ${JSON.stringify(hash)}`)
  await sleep(settle)
}

// Clicks the centre of the element returned by `expression` with real mouse
// events; Radix menus ignore synthetic element.click().
export const click = async (session: CdpSession, expression: string, settle = 1000) => {
  const point = await session.evaluate<{ x: number; y: number } | null>(`(() => {
    const el = (${expression})
    if (!el) return null
    el.scrollIntoView({ block: "center" })
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  })()`)
  if (!point) throw new Error(`Nothing to click: ${expression}`)
  for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) {
    await session.send("Input.dispatchMouseEvent", {
      type,
      ...point,
      button: "left",
      clickCount: 1,
    })
  }
  await sleep(settle)
}

export const pressKey = async (session: CdpSession, key: string, code = key) => {
  for (const type of ["keyDown", "keyUp"]) {
    await session.send("Input.dispatchKeyEvent", {
      type,
      key,
      code,
      windowsVirtualKeyCode: key === "Enter" ? 13 : key === "Escape" ? 27 : 0,
    })
  }
}

export const typeText = (session: CdpSession, text: string) =>
  session.send("Input.insertText", { text })

// Polls `expression` until it is truthy.
export const waitFor = async (session: CdpSession, expression: string, timeout = 60_000) => {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (await session.evaluate<boolean>(`Boolean(${expression})`)) return true
    await sleep(1000)
  }
  return false
}

// Captures in 2 x 2 tiles: a full-window PNG of a photo-heavy view is large
// enough to overflow the DevTools socket message limit.
export const capture = async (session: CdpSession, path: string) => {
  const { width, height, deviceScaleFactor } = viewport
  const tileW = width / 2
  const tileH = height / 2
  const tiles: OverlayOptions[] = []
  for (const [col, row] of [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ] as const) {
    const { data } = await session.send<{ data: string }>("Page.captureScreenshot", {
      format: "png",
      clip: { x: col * tileW, y: row * tileH, width: tileW, height: tileH, scale: 1 },
    })
    tiles.push({
      input: Buffer.from(data, "base64"),
      left: Math.round(col * tileW * deviceScaleFactor),
      top: Math.round(row * tileH * deviceScaleFactor),
    })
  }
  const image = await sharp({
    create: {
      width: Math.round(width * deviceScaleFactor),
      height: Math.round(height * deviceScaleFactor),
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(tiles)
    .png()
    .toBuffer()
  await writeFile(path, image)
}

// Workspace packages are not hoisted into the root node_modules, so read the
// icon source straight from the repo.
const componentsDir = join(import.meta.dirname, "..", "..", "packages", "internal", "components")

// Reproduces what the renderer shows on Windows (apps/desktop/layer/renderer/src/main.tsx
// and SubscriptionColumnHeader.tsx): no traffic-light inset, a 30pt caption bar,
// and the Folo lockup at the top of the sidebar. Reverted by a reload.
export const applyWindowsChrome = async (session: CdpSession) => {
  const source = await readFile(join(componentsDir, "src/icons/folo.tsx"), "utf8")
  const wordmark = /d="([^"]+)"/.exec(source)?.[1]
  if (!wordmark) throw new Error("Folo wordmark path not found")
  await session.evaluate(`(() => {
    document.documentElement.dataset.os = "Windows"
    document.body.style.setProperty("--fo-window-padding-top", "30px")
    document.body.style.removeProperty("--fo-macos-traffic-light-width")
    document.body.style.removeProperty("--fo-macos-traffic-light-height")
    const header = document.querySelector("[data-testid=subscription-discover-trigger]")?.parentElement?.parentElement
    if (!header || header.querySelector(".store-windows-lockup")) return
    header.classList.remove("ml-5", "justify-end")
    header.classList.add("ml-4", "justify-between")
    const lockup = document.createElement("div")
    lockup.className = "store-windows-lockup relative flex items-center gap-1 text-lg font-semibold"
    lockup.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="mr-1 size-6"><path fill="#ff5c00" d="M5.382 0h13.236A5.37 5.37 0 0 1 24 5.383v13.235A5.37 5.37 0 0 1 18.618 24H5.382A5.37 5.37 0 0 1 0 18.618V5.383A5.37 5.37 0 0 1 5.382.001Z"/><path fill="#fff" d="M13.269 17.31a1.813 1.813 0 1 0-3.626.002 1.813 1.813 0 0 0 3.626-.002m-.535-6.527H7.213a1.813 1.813 0 1 0 0 3.624h5.521a1.813 1.813 0 1 0 0-3.624m4.417-4.712H8.87a1.813 1.813 0 1 0 0 3.625h8.283a1.813 1.813 0 1 0 0-3.624z"/></svg><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="size-8"><path fill="currentColor" d="${wordmark}"/></svg>'
    header.prepend(lockup)
  })()`)
}

export const revertWindowsChrome = (session: CdpSession) =>
  session.evaluate(`(() => {
    document.documentElement.dataset.os = "macOS"
    document.body.style.removeProperty("--fo-window-padding-top")
    document.body.style.setProperty("--fo-macos-traffic-light-width", "80px")
    document.body.style.setProperty("--fo-macos-traffic-light-height", "30px")
    const lockup = document.querySelector(".store-windows-lockup")
    const header = lockup?.parentElement
    lockup?.remove()
    header?.classList.remove("ml-4", "justify-between")
    header?.classList.add("ml-5", "justify-end")
  })()`)
