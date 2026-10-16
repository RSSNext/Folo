import { UserRole } from "@follow/constants"
import { useUserStore } from "@follow/store/user/store"
import { jotaiStore } from "@follow/utils"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createSettingAtom } from "./helper"

const mocks = vi.hoisted(() => {
  // Read by the shared constants at import
  vi.stubGlobal("ELECTRON", false)
  return {
    storage: new Map<string, string>(),
    dispatch: vi.fn(),
  }
})

vi.mock("@/src/lib/jotai", () => ({
  JotaiPersistSyncStorage: {
    getItem: <Value>(key: string, defaultValue: Value): Value => {
      const value = mocks.storage.get(key)
      return value === undefined ? defaultValue : JSON.parse(value)
    },
    setItem: (key: string, value: unknown) => {
      mocks.storage.set(key, JSON.stringify(value))
    },
    removeItem: (key: string) => {
      mocks.storage.delete(key)
    },
    subscribe: () => () => {},
  },
}))

// The hooks package reads the browser window at import
vi.mock("@follow/hooks", () => ({
  useRefValue: <T>(value: T) => ({ current: value }),
}))

vi.mock("@follow/store/user/store", async () => {
  const { create } = await import("zustand")
  return { useUserStore: create<{ role: UserRole | null }>(() => ({ role: null })) }
})

vi.mock("@follow/utils/event-bus", () => ({
  EventBus: { dispatch: mocks.dispatch },
}))

const setRole = (role: UserRole | null) => useUserStore.setState({ role })

// "translation" needs the Basic plan, the free plan limits "summary", and "unreadOnly" is free
const createDefaults = () => ({ translation: false, summary: true, unreadOnly: false })
const { getSettings, setSetting, settingAtom } = createSettingAtom("general", createDefaults)
const saved = () => jotaiStore.get(settingAtom)

describe("createSettingAtom paid settings", () => {
  beforeEach(() => {
    mocks.dispatch.mockClear()
    setRole(null)
    jotaiStore.set(settingAtom, { translation: true, summary: false, unreadOnly: true })
  })

  it.each([UserRole.Free, UserRole.Trial])(
    "reads a paid setting a %s plan lacks as its default and keeps the saved value",
    (role) => {
      setRole(role)

      expect(getSettings()).toMatchObject({ translation: false, summary: false, unreadOnly: true })
      expect(saved().translation).toBe(true)
    },
  )

  it.each([
    ["a paid plan", UserRole.Basic],
    ["an unknown role, while it loads or signed out", null],
  ])("reads the saved paid settings for %s", (_, role) => {
    setRole(role)

    expect(getSettings()).toMatchObject({ translation: true, summary: false, unreadOnly: true })
  })

  it("does not turn on a paid setting the plan lacks", () => {
    jotaiStore.set(settingAtom, createDefaults())
    setRole(UserRole.Free)

    setSetting("translation", true)

    expect(saved().translation).toBe(false)
    expect(mocks.dispatch).not.toHaveBeenCalled()
  })

  it("still turns off a paid setting the plan lacks, and saves the other settings", () => {
    setRole(UserRole.Free)

    setSetting("translation", false)
    setSetting("summary", true)
    setSetting("unreadOnly", false)

    expect(saved()).toMatchObject({ translation: false, summary: true, unreadOnly: false })
    expect(mocks.dispatch).toHaveBeenCalledTimes(3)
  })

  it("turns on a paid setting for a paid plan", () => {
    jotaiStore.set(settingAtom, createDefaults())
    setRole(UserRole.Pro)

    setSetting("translation", true)

    expect(getSettings().translation).toBe(true)
    expect(mocks.dispatch).toHaveBeenCalledWith("SETTING_CHANGE_EVENT", {
      key: "general",
      payload: { translation: true },
    })
  })
})
