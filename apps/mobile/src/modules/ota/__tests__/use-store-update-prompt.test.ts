import { beforeEach, describe, expect, it, vi } from "vitest"

interface AlertButton {
  text: string
  onPress?: () => void
}

const { appState, alertMock, kvStore } = vi.hoisted(() => ({
  appState: { currentState: "active" },
  alertMock: vi.fn(),
  kvStore: new Map<string, string>(),
}))

vi.mock("react-native", () => ({
  Alert: { alert: alertMock },
  AppState: appState,
  Linking: { canOpenURL: vi.fn(async () => false), openURL: vi.fn(async () => {}) },
  Platform: { OS: "ios" },
}))
vi.mock("i18next", () => ({ t: (key: string) => key }))
vi.mock("@/src/lib/kv", () => ({
  kv: {
    getSync: (key: string) => kvStore.get(key) ?? null,
    setSync: (key: string, value: string) => void kvStore.set(key, value),
  },
}))
vi.mock("@/src/lib/jotai", async () => ({ jotaiStore: (await import("jotai")).createStore() }))
vi.mock("@/src/lib/dialog-state", async () => ({
  nativeAlertCountAtom: (await import("jotai")).atom(0),
}))
vi.mock("@/src/lib/payment", () => ({ isAndroidApkInstall: () => false }))
vi.mock("@follow/constants", () => ({
  APP_STORE_URLS: { iOS: "https://apps.apple.com/app", Android: "https://play.google.com/app" },
  GOOGLE_PLAY_PACKAGE_ID: "is.follow",
}))

const { showStoreUpdatePrompt } = await import("../use-store-update-prompt")
const { jotaiStore: store } = await import("@/src/lib/jotai")
const { nativeAlertCountAtom: alertCountAtom } = await import("@/src/lib/dialog-state")

const target = { url: "https://apps.apple.com/app", store: "app_store" as const }
const prompt = { action: "prompt" as const, targetVersion: "0.6.0", message: null }

const pressButton = (text: string) => {
  const buttons = alertMock.mock.lastCall?.[2] as AlertButton[]
  buttons.find((button) => button.text === text)?.onPress?.()
}

describe("showStoreUpdatePrompt", () => {
  beforeEach(() => {
    alertMock.mockClear()
    kvStore.clear()
    store.set(alertCountAtom, 0)
    appState.currentState = "active"
  })

  it("waits for the app to be in front", () => {
    const state = { isShowing: false, shownVersion: null }
    appState.currentState = "background"
    showStoreUpdatePrompt(prompt, target, state)
    expect(alertMock).not.toHaveBeenCalled()
    expect(state.isShowing).toBe(false)

    appState.currentState = "active"
    showStoreUpdatePrompt(prompt, target, state)
    expect(alertMock).toHaveBeenCalledTimes(1)
  })

  it("asks once per launch for a prompt, whatever re-runs it", () => {
    const state = { isShowing: false, shownVersion: null }
    showStoreUpdatePrompt(prompt, target, state)
    pressButton("update.store.update")
    showStoreUpdatePrompt(prompt, target, state)
    expect(alertMock).toHaveBeenCalledTimes(1)
  })

  it("keeps a version the user put off quiet in later launches", () => {
    showStoreUpdatePrompt(prompt, target, { isShowing: false, shownVersion: null })
    pressButton("update.store.later")
    showStoreUpdatePrompt(prompt, target, { isShowing: false, shownVersion: null })
    expect(alertMock).toHaveBeenCalledTimes(1)
  })

  it("asks again for a blocked version once the alert is closed", () => {
    const state = { isShowing: false, shownVersion: null }
    const block = { ...prompt, action: "block" as const }
    showStoreUpdatePrompt(block, target, state)
    showStoreUpdatePrompt(block, target, state)
    expect(alertMock).toHaveBeenCalledTimes(1)

    pressButton("update.store.update")
    showStoreUpdatePrompt(block, target, state)
    expect(alertMock).toHaveBeenCalledTimes(2)
  })

  it("counts the open alert so other prompts stay away", () => {
    const state = { isShowing: false, shownVersion: null }
    showStoreUpdatePrompt(prompt, target, state)
    expect(store.get(alertCountAtom)).toBe(1)

    pressButton("update.store.later")
    expect(store.get(alertCountAtom)).toBe(0)
  })
})
