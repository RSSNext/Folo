import { beforeEach, describe, expect, it, vi } from "vitest"

interface WindowMetrics {
  width: number
  height: number
  scale: number
  fontScale: number
}
type ChangeListener = (event: { window: WindowMetrics }) => void

const mocks = vi.hoisted(() => {
  const listeners = new Set<ChangeListener>()
  const state = {
    window: { width: 1032, height: 1376, scale: 2, fontScale: 1 } as WindowMetrics,
  }
  return {
    listeners,
    state,
    Dimensions: {
      get: (_dim: "window") => state.window,
      // Like React Native, every update hands out a new window object, then emits it
      set: (size: Pick<WindowMetrics, "width" | "height">) => {
        state.window = { ...state.window, ...size }
        for (const listener of listeners) {
          listener({ window: state.window })
        }
      },
      addEventListener: (_type: "change", listener: ChangeListener) => {
        listeners.add(listener)
        return { remove: () => listeners.delete(listener) }
      },
    },
  }
})

vi.mock("react-native", () => ({
  Dimensions: mocks.Dimensions,
  useWindowDimensions: () => mocks.Dimensions.get("window"),
}))
vi.mock("expo-device", () => ({ DeviceType: { PHONE: 1, TABLET: 2 } }))
vi.mock("../atoms/hooks/useDeviceType", () => ({ useDeviceType: () => 2 }))
vi.mock("./platform", () => ({ isIOS: true }))

describe("responsive", () => {
  beforeEach(() => {
    vi.resetModules()
    mocks.listeners.clear()
    mocks.state.window = { width: 1032, height: 1376, scale: 2, fontScale: 1 }
  })

  it("leaves the window object alone, so useWindowDimensions sees every later change", async () => {
    // What useWindowDimensions keeps as its state in a component mounted at launch
    const mountedWindow = mocks.Dimensions.get("window")
    // Loads first at app start, before any component subscribes
    await import("./responsive")

    // useWindowDimensions re-renders only when the event differs from the object it keeps
    const rerenders: WindowMetrics[] = []
    mocks.Dimensions.addEventListener("change", ({ window }) => {
      if (mountedWindow.width !== window.width || mountedWindow.height !== window.height) {
        rerenders.push(window)
      }
    })

    mocks.Dimensions.set({ width: 375, height: 1310 })

    expect(rerenders).toHaveLength(1)
    expect(mountedWindow).toMatchObject({ width: 1032, height: 1376 })
  })

  it("scales with the window shown now", async () => {
    const { scaleHeight, scaleWidth } = await import("./responsive")

    expect(scaleWidth(375)).toBe(1032)

    mocks.Dimensions.set({ width: 375, height: 812 })

    expect(scaleWidth(375)).toBe(375)
    expect(scaleHeight(812)).toBe(812)
  })
})
