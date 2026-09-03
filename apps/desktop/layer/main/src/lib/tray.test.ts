import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const env = {
    isMacOS: false,
    isMAS: false,
    isWindows: false,
    isLinux: false,
  }

  return {
    app: {
      getName: vi.fn(() => "Folo"),
      quit: vi.fn(),
    },
    buildFromTemplate: vi.fn((template) => ({ template })),
    env,
    getBadgeCount: vi.fn(() => 0),
    getTrayIconPath: vi.fn(() => "/icon.png"),
    logger: {
      info: vi.fn(),
    },
    nativeImage: {
      createFromPath: vi.fn(() => {
        const image = {
          resize: vi.fn(() => image),
          setTemplateImage: vi.fn(),
        }
        return image
      }),
    },
    store: {
      get: vi.fn(() => true),
      set: vi.fn(),
    },
    trayInstances: [] as Array<{
      destroy: ReturnType<typeof vi.fn>
      on: ReturnType<typeof vi.fn>
      setContextMenu: ReturnType<typeof vi.fn>
      setToolTip: ReturnType<typeof vi.fn>
    }>,
    Tray: class {
      constructor() {
        const tray = {
          destroy: vi.fn(),
          on: vi.fn(),
          setContextMenu: vi.fn(),
          setToolTip: vi.fn(),
        }
        mocks.trayInstances.push(tray)
        return tray
      }
    },
  }
})

vi.mock("electron", () => ({
  app: {
    getName: mocks.app.getName,
    getBadgeCount: mocks.getBadgeCount,
    quit: mocks.app.quit,
    setBadgeCount: vi.fn(),
  },
  Menu: {
    buildFromTemplate: mocks.buildFromTemplate,
  },
  nativeImage: mocks.nativeImage,
  Tray: mocks.Tray,
}))

vi.mock("~/env", () => mocks.env)

vi.mock("~/helper", () => ({
  getTrayIconPath: mocks.getTrayIconPath,
}))

vi.mock("~/logger", () => ({
  logger: mocks.logger,
  revealLogFile: vi.fn(),
}))

vi.mock("~/manager/window", () => ({
  WindowManager: {
    getMainWindowOrCreate: vi.fn(() => ({
      isMinimized: vi.fn(() => false),
      show: vi.fn(),
      webContents: {
        reload: vi.fn(),
        toggleDevTools: vi.fn(),
      },
    })),
  },
}))

vi.mock("~/updater", () => ({
  checkForAppUpdates: vi.fn(),
}))

vi.mock("./i18n", () => ({
  t: vi.fn((key: string, options?: { name?: string }) =>
    options?.name ? `${key} ${options.name}` : key,
  ),
}))

vi.mock("./store", () => ({
  store: mocks.store,
}))

describe("tray", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    mocks.env.isMacOS = false
    mocks.env.isMAS = false
    mocks.env.isWindows = false
    mocks.env.isLinux = false
    mocks.getBadgeCount.mockReturnValue(0)
    mocks.store.get.mockReturnValue(true)
    mocks.trayInstances.length = 0
  })

  it("refreshes the existing tray menu instead of recreating the native tray", async () => {
    const { registerAppTray } = await import("./tray")

    registerAppTray()
    registerAppTray()

    expect(mocks.trayInstances).toHaveLength(1)
    expect(mocks.trayInstances[0]!.destroy).not.toHaveBeenCalled()
    expect(mocks.trayInstances[0]!.setContextMenu).toHaveBeenCalledTimes(2)
  })

  it("destroys the native tray when disabled off Linux", async () => {
    const { registerAppTray, setTrayConfig } = await import("./tray")

    registerAppTray()
    const needsRestart = setTrayConfig(false)

    expect(mocks.trayInstances[0]!.destroy).toHaveBeenCalledTimes(1)
    expect(needsRestart).toBe(false)
  })

  it("keeps the native tray on Linux when disabled and reports a restart is needed", async () => {
    // Electron's Tray.destroy() can't remove a StatusNotifierItem icon while the
    // process runs, so recreating it would stack a dead icon. Keep the instance
    // and let the caller offer a restart instead.
    mocks.env.isLinux = true
    const { registerAppTray, setTrayConfig } = await import("./tray")

    registerAppTray()
    const needsRestart = setTrayConfig(false)

    expect(mocks.trayInstances[0]!.destroy).not.toHaveBeenCalled()
    expect(needsRestart).toBe(true)

    // Re-enabling reuses the same instance rather than creating a second one.
    setTrayConfig(true)
    expect(mocks.trayInstances).toHaveLength(1)
  })
})
