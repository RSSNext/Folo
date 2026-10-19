import { fileURLToPath } from "node:url"

import type { BrowserWindow, ContextMenuParams, IpcMainEvent, WebContents } from "electron"
import { ipcMain, Menu, WebContentsView } from "electron"
import path from "pathe"

import type { FindDirection, FindRequest, FindResult } from "~/lib/find-in-page-session"
import { FindInPageSession } from "~/lib/find-in-page-session"
import { t } from "~/lib/i18n"
import { logger } from "~/logger"

import {
  FIND_BAR_HEIGHT,
  FIND_BAR_SHADOW_MARGIN,
  FIND_BAR_WIDTH,
  FindBarChannel,
  findBarPage,
} from "./find-bar-page"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const preloadScript = path.join(__dirname, "../preload/index.mjs")

// Where the bar sits in the window, like the page's own panels: 32 px from the right edge and
// 48 px from the top
const BAR_RIGHT = 32
const BAR_TOP = 48

const findInPage = (
  webContents: WebContents,
  { text, direction, findNext }: FindRequest & { findNext: boolean },
  signal: AbortSignal,
) =>
  new Promise<FindResult | null>((resolve) => {
    if (webContents.isDestroyed()) {
      resolve(null)
      return
    }

    let requestId = -1
    const finish = (result: FindResult | null) => {
      webContents.off("found-in-page", onFoundInPage)
      signal.removeEventListener("abort", onAbort)
      resolve(result)
    }
    const onFoundInPage = (_event: Electron.Event, result: Electron.Result) => {
      // A late answer to an earlier request isn't the answer to this one
      if (result.requestId !== requestId) return
      finish({ activeMatchOrdinal: result.activeMatchOrdinal, matches: result.matches })
    }
    const onAbort = () => finish(null)

    webContents.on("found-in-page", onFoundInPage)
    signal.addEventListener("abort", onAbort)
    requestId = webContents.findInPage(text, { findNext, forward: direction === "forward" })
  })

const isFindDirection = (value: unknown): value is FindDirection =>
  value === "forward" || value === "backward"

/**
 * The editing menu the text fields of the window's page have. Labeled when it opens, so it
 * follows a change of the app's language. The actions go to the field's page itself, which
 * need not be the focused one, e.g. after a right click in an inactive window.
 */
const showFieldContextMenu = (
  window: BrowserWindow,
  field: WebContents,
  { isEditable, editFlags }: ContextMenuParams,
) => {
  if (!isEditable) return
  Menu.buildFromTemplate([
    { label: t("menu.undo"), enabled: editFlags.canUndo, click: () => field.undo() },
    { label: t("menu.redo"), enabled: editFlags.canRedo, click: () => field.redo() },
    { type: "separator" },
    { label: t("contextMenu.cut"), enabled: editFlags.canCut, click: () => field.cut() },
    { label: t("contextMenu.copy"), enabled: editFlags.canCopy, click: () => field.copy() },
    { label: t("contextMenu.paste"), enabled: editFlags.canPaste, click: () => field.paste() },
    { type: "separator" },
    {
      label: t("contextMenu.selectAll"),
      enabled: editFlags.canSelectAll,
      click: () => field.selectAll(),
    },
  ]).popup({ window })
}

/**
 * The window's find bar. Chromium's find in page clears the focus in the page it searches and
 * starts from the selection there, and it would count a field in that page as a match, so the
 * bar lives in a view of its own above the page.
 */
class FindBar {
  private readonly view = new WebContentsView({
    webPreferences: {
      preload: preloadScript,
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  })

  /** The id of the bar's page, kept for after the window is gone */
  readonly webContentsId = this.view.webContents.id

  private readonly session: FindInPageSession
  private readonly loaded: Promise<void>
  private shown = false

  constructor(private readonly window: BrowserWindow) {
    this.view.setBackgroundColor("#00000000")
    this.view.setVisible(false)
    window.contentView.addChildView(this.view)
    this.layout()
    this.loaded = this.view.webContents
      .loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(findBarPage)}`)
      .catch((error) => {
        logger.error("Failed to load the find bar", error)
      })
    // The app's context menu only covers the window's own page
    this.view.webContents.on("context-menu", (_event, params) => {
      showFieldContextMenu(window, this.view.webContents, params)
    })

    this.session = new FindInPageSession({
      find: (request, signal) => findInPage(window.webContents, request, signal),
      stop: () => {
        if (!window.isDestroyed()) window.webContents.stopFindInPage("keepSelection")
      },
      onResult: (result) => this.send(FindBarChannel.result, result),
    })

    window.on("resize", this.layout)
    // A new document has none of the matches the session stepped through
    window.webContents.on("did-navigate", () => {
      this.session.dispose()
      this.send(FindBarChannel.result, { activeMatchOrdinal: 0, matches: 0 })
    })
    window.on("closed", () => {
      this.session.dispose()
      findBars.delete(this.webContentsId)
      if (!this.view.webContents.isDestroyed()) this.view.webContents.close()
    })
  }

  async open() {
    this.shown = true
    this.view.setVisible(true)
    this.layout()
    this.view.webContents.focus()
    await this.loaded

    // The page's accent color, which can be changed in the settings
    const accent = await this.window.webContents
      .executeJavaScript(
        `getComputedStyle(document.documentElement).getPropertyValue("--fo-a").trim()`,
      )
      .then((value: unknown) => (typeof value === "string" && value ? `hsl(${value})` : null))
      .catch(() => null)
    if (!this.shown) return
    this.send(FindBarChannel.open, {
      labels: {
        find: t("menu.search"),
        previous: t("findBar.previous"),
        next: t("findBar.next"),
        close: t("menu.close"),
      },
      accent,
    })
  }

  find(request: FindRequest) {
    // The bar's page may still send a search it started before it was closed, e.g. text typed
    // right before Escape. It would highlight matches with no bar left to clear them.
    if (!this.shown) return
    this.session.find(request)
  }

  clear() {
    this.session.clear()
  }

  close() {
    if (!this.shown) return
    this.shown = false
    this.session.clear()
    this.send(FindBarChannel.result, { activeMatchOrdinal: 0, matches: 0 })
    this.view.setVisible(false)
    if (!this.window.isDestroyed()) this.window.webContents.focus()
  }

  private send(channel: string, payload: unknown) {
    if (!this.view.webContents.isDestroyed()) this.view.webContents.send(channel, payload)
  }

  private layout = () => {
    if (this.window.isDestroyed()) return
    const { width } = this.window.getContentBounds()
    this.view.setBounds({
      x: Math.max(0, width - BAR_RIGHT - FIND_BAR_WIDTH - FIND_BAR_SHADOW_MARGIN.side),
      y: BAR_TOP - FIND_BAR_SHADOW_MARGIN.top,
      width: FIND_BAR_WIDTH + FIND_BAR_SHADOW_MARGIN.side * 2,
      height: FIND_BAR_HEIGHT + FIND_BAR_SHADOW_MARGIN.top + FIND_BAR_SHADOW_MARGIN.bottom,
    })
  }
}

/** Find bars by the id of their page */
const findBars = new Map<number, FindBar>()
const findBarsByWindow = new WeakMap<BrowserWindow, FindBar>()

let ipcRegistered = false
const registerIpc = () => {
  if (ipcRegistered) return
  ipcRegistered = true

  const barOf = (event: IpcMainEvent) => findBars.get(event.sender.id)
  ipcMain.on(FindBarChannel.find, (event, payload: unknown) => {
    if (typeof payload !== "object" || payload === null) return
    const { text, direction } = payload as Record<string, unknown>
    if (typeof text !== "string" || !text || !isFindDirection(direction)) return
    barOf(event)?.find({ text, direction })
  })
  ipcMain.on(FindBarChannel.clear, (event) => barOf(event)?.clear())
  ipcMain.on(FindBarChannel.close, (event) => barOf(event)?.close())
}

export const FindBarManager = {
  open(window: BrowserWindow) {
    registerIpc()
    let bar = findBarsByWindow.get(window)
    if (!bar) {
      bar = new FindBar(window)
      findBarsByWindow.set(window, bar)
      findBars.set(bar.webContentsId, bar)
    }
    void bar.open()
  },
}
