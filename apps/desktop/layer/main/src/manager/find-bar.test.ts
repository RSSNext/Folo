import { EventEmitter } from "node:events"

import type { BrowserWindow } from "electron"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  ipcHandlers: new Map<string, (event: { sender: { id: number } }, payload?: unknown) => void>(),
  menus: [] as Array<{
    template: Array<{ label?: string; type?: string; enabled?: boolean; click?: () => void }>
    popup: ReturnType<typeof vi.fn>
  }>,
  views: [] as Array<{
    setBounds: ReturnType<typeof vi.fn>
    setVisible: ReturnType<typeof vi.fn>
    webContents: {
      id: number
      emit: (event: string, ...args: unknown[]) => boolean
      focus: ReturnType<typeof vi.fn>
      paste: ReturnType<typeof vi.fn>
      send: ReturnType<typeof vi.fn>
    }
  }>,
}))

vi.mock("electron", async () => {
  const { EventEmitter } = await import("node:events")
  let nextId = 100

  class FakeViewWebContents extends EventEmitter {
    id = nextId++
    close = vi.fn()
    focus = vi.fn()
    isDestroyed = () => false
    loadURL = vi.fn(() => Promise.resolve())
    paste = vi.fn()
    send = vi.fn()
  }

  class WebContentsView {
    webContents = new FakeViewWebContents()
    setBackgroundColor = vi.fn()
    setBounds = vi.fn()
    setVisible = vi.fn()

    constructor() {
      mocks.views.push(this)
    }
  }

  return {
    ipcMain: {
      on: (channel: string, handler: (event: { sender: { id: number } }) => void) => {
        mocks.ipcHandlers.set(channel, handler)
      },
    },
    Menu: {
      buildFromTemplate: (template: (typeof mocks.menus)[number]["template"]) => {
        const menu = { template, popup: vi.fn() }
        mocks.menus.push(menu)
        return menu
      },
    },
    WebContentsView,
  }
})

vi.mock("~/lib/i18n", () => ({ t: (key: string) => key }))
vi.mock("~/logger", () => ({ logger: { error: vi.fn() } }))

const { FindBarManager } = await import("./find-bar")

class FakePage extends EventEmitter {
  private requestId = 0
  findInPage = vi.fn((_text: string, _options: Electron.FindInPageOptions) => {
    const requestId = ++this.requestId
    setTimeout(() => {
      this.emit("found-in-page", {}, { requestId, activeMatchOrdinal: requestId, matches: 4 })
    })
    return requestId
  })

  stopFindInPage = vi.fn()
  focus = vi.fn()
  isDestroyed = () => false
  executeJavaScript = vi.fn(() => Promise.resolve("21.6 100% 50%"))
}

class FakeWindow extends EventEmitter {
  webContents = new FakePage()
  contentView = { addChildView: vi.fn() }
  getContentBounds = () => ({ x: 0, y: 0, width: 1200, height: 800 })
  isDestroyed = () => false
}

const openFindBar = async () => {
  const window = new FakeWindow()
  FindBarManager.open(window as unknown as BrowserWindow)
  const view = mocks.views.at(-1)!
  await vi.waitFor(() => {
    expect(view.webContents.send).toHaveBeenCalledWith("find-bar:open", expect.anything())
  })
  const fromBar = (channel: string, payload?: unknown) =>
    mocks.ipcHandlers.get(channel)?.({ sender: { id: view.webContents.id } }, payload)
  return { window, view, fromBar }
}

describe("FindBarManager", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("opens one bar per window, focused, with the page's accent color", async () => {
    const { window, view } = await openFindBar()
    const viewCount = mocks.views.length

    FindBarManager.open(window as unknown as BrowserWindow)

    expect(mocks.views).toHaveLength(viewCount)
    expect(view.setVisible).toHaveBeenLastCalledWith(true)
    expect(view.webContents.focus).toHaveBeenCalled()
    expect(view.webContents.send).toHaveBeenCalledWith(
      "find-bar:open",
      expect.objectContaining({ accent: "hsl(21.6 100% 50%)" }),
    )
  })

  it("sits below the page's header buttons, 32 px from the right edge", async () => {
    const { view } = await openFindBar()

    // The view takes the clicks within its bounds, shadow room included. The header buttons of
    // the page reach down to 42 px, and the bar itself starts at 48 px.
    expect(view.setBounds).toHaveBeenLastCalledWith({
      x: 1200 - 32 - 256 - 16,
      y: 42,
      width: 256 + 16 * 2,
      height: 36 + 6 + 16,
    })
  })

  it("finds in the window's page and steps through the matches", async () => {
    const { window, view, fromBar } = await openFindBar()

    fromBar("find-bar:find", { text: "timeline", direction: "forward" })
    await vi.waitFor(() => {
      expect(view.webContents.send).toHaveBeenCalledWith("find-bar:result", {
        activeMatchOrdinal: 1,
        matches: 4,
      })
    })
    fromBar("find-bar:find", { text: "timeline", direction: "backward" })
    await vi.waitFor(() => {
      expect(window.webContents.findInPage).toHaveBeenCalledTimes(2)
    })

    expect(window.webContents.findInPage.mock.calls).toEqual([
      ["timeline", { findNext: true, forward: true }],
      ["timeline", { findNext: false, forward: false }],
    ])
  })

  it("ignores malformed requests and requests from other pages", async () => {
    const { window, fromBar } = await openFindBar()

    fromBar("find-bar:find", { text: 1, direction: "forward" })
    fromBar("find-bar:find", { text: "timeline", direction: "sideways" })
    fromBar("find-bar:find", null)
    mocks.ipcHandlers.get("find-bar:find")?.(
      { sender: { id: -1 } },
      { text: "timeline", direction: "forward" },
    )

    expect(window.webContents.findInPage).not.toHaveBeenCalled()
  })

  it("stops finding, hides and hands the focus back to the page when closed", async () => {
    const { window, view, fromBar } = await openFindBar()

    fromBar("find-bar:close")

    expect(window.webContents.stopFindInPage).toHaveBeenCalledWith("keepSelection")
    expect(view.webContents.send).toHaveBeenLastCalledWith("find-bar:result", {
      activeMatchOrdinal: 0,
      matches: 0,
    })
    expect(view.setVisible).toHaveBeenLastCalledWith(false)
    expect(window.webContents.focus).toHaveBeenCalled()
  })

  it("ignores a search the bar sends after it was closed", async () => {
    const { window, fromBar } = await openFindBar()

    // E.g. text typed right before Escape, whose search waited for the typing to stop
    fromBar("find-bar:close")
    fromBar("find-bar:find", { text: "timeline", direction: "forward" })

    expect(window.webContents.findInPage).not.toHaveBeenCalled()

    FindBarManager.open(window as unknown as BrowserWindow)
    fromBar("find-bar:find", { text: "timeline", direction: "forward" })

    expect(window.webContents.findInPage).toHaveBeenCalledTimes(1)
  })

  it("gives the field the editing menu of the page's own fields", async () => {
    const { window, view } = await openFindBar()
    const editFlags = {
      canUndo: false,
      canRedo: false,
      canCut: true,
      canCopy: true,
      canPaste: true,
      canSelectAll: true,
    }
    mocks.menus.length = 0

    view.webContents.emit("context-menu", {}, { isEditable: false, editFlags })
    expect(mocks.menus).toHaveLength(0)

    view.webContents.emit("context-menu", {}, { isEditable: true, editFlags })
    const [menu] = mocks.menus
    expect(menu?.template.map((item) => [item.label ?? item.type, item.enabled])).toEqual([
      ["menu.undo", false],
      ["menu.redo", false],
      ["separator", undefined],
      ["contextMenu.cut", true],
      ["contextMenu.copy", true],
      ["contextMenu.paste", true],
      ["separator", undefined],
      ["contextMenu.selectAll", true],
    ])
    expect(menu?.popup).toHaveBeenCalledWith({ window })

    // Pastes into the bar even when another page has the focus
    menu?.template.find((item) => item.label === "contextMenu.paste")?.click?.()
    expect(view.webContents.paste).toHaveBeenCalledTimes(1)
  })
})
