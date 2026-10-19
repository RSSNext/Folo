import { EventEmitter } from "node:events"

import type { BrowserWindow } from "electron"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  ask: vi.fn(),
  onWindowClose: vi.fn(),
  onWindowShow: vi.fn(),
  openExternal: vi.fn(),
}))

vi.mock("@electron-toolkit/utils", () => ({ is: { dev: false } }))
vi.mock("@follow/shared", () => ({ LEGACY_APP_PROTOCOL: "follow" }))
vi.mock("@follow/shared/bridge", () => ({
  callWindowExpose: () => ({
    dialog: { ask: mocks.ask },
    onWindowClose: mocks.onWindowClose,
    onWindowShow: mocks.onWindowShow,
  }),
  WindowState: {},
}))
vi.mock("@follow/shared/constants", () => ({ APP_PROTOCOL: "folo", DEV: false }))
vi.mock("electron", () => ({
  BrowserWindow: class {},
  screen: {},
  shell: { openExternal: mocks.openExternal },
}))
vi.mock("~/env", () => ({ isMacOS: true, isWindows: false }))
vi.mock("~/helper", () => ({
  filePathToAppUrl: (filePath: string) => `app://folo.is${filePath}`,
  getIconPath: vi.fn(),
}))
vi.mock("~/lib/deep-link", () => ({ setRendererReady: vi.fn() }))
vi.mock("~/lib/i18n", () => ({ t: (key: string) => key }))
vi.mock("~/lib/store", () => ({ store: { get: vi.fn(), set: vi.fn() } }))
vi.mock("~/lib/tray", () => ({ getTrayConfig: () => false }))
vi.mock("~/lib/utils", () => ({ refreshBound: vi.fn() }))
vi.mock("~/logger", () => ({ logger: { info: vi.fn(), log: vi.fn(), warn: vi.fn() } }))
vi.mock("~/updater/hot-updater", () => ({ loadDynamicRenderEntry: vi.fn() }))

const { WindowManager } = await import("./window")

class FakeWindow extends EventEmitter {
  webContents = Object.assign(new EventEmitter(), { setWindowOpenHandler: vi.fn() })
  hide = vi.fn()
  isFullScreen = () => false
  isMaximized = () => false
  getBounds = () => ({ height: 700, width: 1000, x: 0, y: 0 })
}

const bindMainWindowCloseHandlers = (window: FakeWindow) => {
  const bind = Reflect.get(WindowManager, "bindMainWindowCloseHandlers") as (
    window: BrowserWindow,
  ) => void
  bind.call(WindowManager, window as unknown as BrowserWindow)
}

describe("main window visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("tells the renderer when the window it hid on close is shown again", () => {
    const window = new FakeWindow()
    bindMainWindowCloseHandlers(window)

    window.emit("close", { preventDefault: vi.fn() })
    expect(window.hide).toHaveBeenCalledTimes(1)
    expect(mocks.onWindowClose).toHaveBeenCalledTimes(1)
    expect(mocks.onWindowShow).not.toHaveBeenCalled()

    window.emit("show")
    expect(mocks.onWindowShow).toHaveBeenCalledTimes(1)
  })
})

describe("main window navigation", () => {
  const navigate = (url: string) => {
    const window = new FakeWindow()
    const bindEvents = Reflect.get(WindowManager, "bindEvents") as (window: BrowserWindow) => void
    bindEvents.call(WindowManager, window as unknown as BrowserWindow)

    const event = { preventDefault: vi.fn() }
    window.webContents.emit("will-navigate", event, url)
    return event
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.ask.mockResolvedValue(true)
  })

  it("keeps the app's own pages, e.g. on a reload", () => {
    const event = navigate("app://folo.is/Applications/Folo.app/renderer/index.html#/timeline")

    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(mocks.openExternal).not.toHaveBeenCalled()
  })

  it("opens web pages in the browser instead of the window", () => {
    const event = navigate("https://example.com/folo-nav-test")

    expect(event.preventDefault).toHaveBeenCalled()
    expect(mocks.openExternal).toHaveBeenCalledWith("https://example.com/folo-nav-test")
  })

  it("blocks other local pages", () => {
    for (const url of ["app://other.host/tmp/page.html", "file:///tmp/page.html", "not a url"]) {
      const event = navigate(url)
      expect(event.preventDefault).toHaveBeenCalled()
    }
    expect(mocks.openExternal).not.toHaveBeenCalled()
  })

  it("leaves the app's deep links to the system", () => {
    const event = navigate("folo://feed?id=1")

    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it("asks before opening another app", async () => {
    const event = navigate("mailto:someone@example.com")

    expect(event.preventDefault).toHaveBeenCalled()
    await vi.waitFor(() => {
      expect(mocks.openExternal).toHaveBeenCalledWith("mailto:someone@example.com")
    })
    expect(mocks.ask).toHaveBeenCalledTimes(1)
  })
})
