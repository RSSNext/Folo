import { beforeEach, describe, expect, it, vi } from "vitest"

import { impactAsync, notificationAsync, selectionAsync, vibrate } from "./haptics"

const mocks = vi.hoisted(() => ({
  settings: { hapticFeedback: true } as { hapticFeedback?: boolean },
  impactAsync: vi.fn(async () => {}),
  notificationAsync: vi.fn(async () => {}),
  selectionAsync: vi.fn(async () => {}),
  vibrate: vi.fn(),
}))

vi.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: { Light: "light" },
  NotificationFeedbackType: { Success: "success" },
  impactAsync: mocks.impactAsync,
  notificationAsync: mocks.notificationAsync,
  selectionAsync: mocks.selectionAsync,
}))
vi.mock("react-native", () => ({ Vibration: { vibrate: mocks.vibrate } }))
vi.mock("@/src/atoms/settings/ui", () => ({ getUISettings: () => mocks.settings }))

const playAll = async () => {
  await impactAsync()
  await notificationAsync()
  await selectionAsync()
  vibrate(10)
}

beforeEach(() => {
  mocks.impactAsync.mockClear()
  mocks.notificationAsync.mockClear()
  mocks.selectionAsync.mockClear()
  mocks.vibrate.mockClear()
})

describe("haptics", () => {
  it("plays haptics while haptic feedback is on", async () => {
    mocks.settings = { hapticFeedback: true }
    await playAll()
    expect(mocks.impactAsync).toHaveBeenCalledTimes(1)
    expect(mocks.notificationAsync).toHaveBeenCalledTimes(1)
    expect(mocks.selectionAsync).toHaveBeenCalledTimes(1)
    expect(mocks.vibrate).toHaveBeenCalledWith(10)
  })

  it("plays nothing once haptic feedback is turned off", async () => {
    mocks.settings = { hapticFeedback: false }
    await playAll()
    expect(mocks.impactAsync).not.toHaveBeenCalled()
    expect(mocks.notificationAsync).not.toHaveBeenCalled()
    expect(mocks.selectionAsync).not.toHaveBeenCalled()
    expect(mocks.vibrate).not.toHaveBeenCalled()
  })

  it("keeps haptics on for settings saved before the option existed", async () => {
    mocks.settings = {}
    await impactAsync()
    expect(mocks.impactAsync).toHaveBeenCalledTimes(1)
  })
})
