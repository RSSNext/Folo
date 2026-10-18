import { EventEmitter } from "node:events"

import type { BrowserWindow } from "electron"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  onWindowClose: vi.fn(),
  onWindowShow: vi.fn(),
}))

vi.mock("@electron-toolkit/utils", () => ({ is: { dev: false } }))
vi.mock("@follow/shared", () => ({ LEGACY_APP_PROTOCOL: "follow" }))
vi.mock("@follow/shared/bridge", () => ({
  callWindowExpose: () => ({
    onWindowClose: mocks.onWindowClose,
    onWindowShow: mocks.onWindowShow,
  }),
  WindowState: {},
}))
vi.mock("@follow/shared/constants", () => ({ APP_PROTOCOL: "folo", DEV: false }))
vi.mock("electron", () => ({ BrowserWindow: class {}, screen: {}, shell: {} }))
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
