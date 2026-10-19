import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createMainWindow: vi.fn(),
  createWindow: vi.fn(),
  getMainWindow: vi.fn(),
  goToFeed: vi.fn(),
  openDeepLink: vi.fn(),
}))

vi.mock("@follow/shared/bridge", () => ({
  callWindowExpose: () => ({ goToFeed: mocks.goToFeed }),
}))

vi.mock("~/lib/deep-link", () => ({
  openDeepLink: mocks.openDeepLink,
}))

vi.mock("~/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

vi.mock("~/manager/window", () => ({
  WindowManager: {
    createMainWindow: mocks.createMainWindow,
    createWindow: mocks.createWindow,
    getMainWindow: mocks.getMainWindow,
  },
}))

const { handleUrlRouting } = await import("./router")

const createMainWindow = () => ({
  focus: vi.fn(),
  restore: vi.fn(),
})

describe("handleUrlRouting", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("brings the main window to the front for a link with an unknown path", () => {
    const mainWindow = createMainWindow()
    mocks.getMainWindow.mockReturnValue(mainWindow)

    handleUrlRouting("folo://this/is/not-a-route?x=1")
    handleUrlRouting("folo://entry?id=1&view=0")

    expect(mocks.createWindow).not.toHaveBeenCalled()
    expect(mainWindow.focus).toHaveBeenCalledTimes(2)
  })

  it("opens the main window first when it is gone, then routes the link again", () => {
    mocks.getMainWindow.mockReturnValue(null)

    handleUrlRouting("folo://this/is/not-a-route")

    expect(mocks.createWindow).not.toHaveBeenCalled()
    expect(mocks.createMainWindow).toHaveBeenCalledTimes(1)
    expect(mocks.openDeepLink).toHaveBeenCalledWith("folo://this/is/not-a-route")
  })

  it("keeps routing the links the app knows", () => {
    const mainWindow = createMainWindow()
    mocks.getMainWindow.mockReturnValue(mainWindow)

    handleUrlRouting("folo://feed?id=41&view=2")

    expect(mocks.goToFeed).toHaveBeenCalledWith({ id: "41", view: 2 })
    expect(mocks.createWindow).not.toHaveBeenCalled()
  })
})
