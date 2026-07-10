import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import {
  getGeneralSettings,
  initializeDefaultGeneralSettings,
  setGeneralSetting,
} from "~/atoms/settings/general"
import {
  getSpotlightSettings,
  initializeDefaultSpotlightSettings,
  setSpotlightSetting,
} from "~/atoms/settings/spotlight"
import { initializeDefaultUISettings } from "~/atoms/settings/ui"

import { settingSyncQueue } from "./sync-queue"

const { settingsGetMock, settingsPrefetchMock, settingsUpdateMock, whoamiMock } = vi.hoisted(
  () => ({
    settingsGetMock: vi.fn(),
    settingsPrefetchMock: vi.fn(),
    settingsUpdateMock: vi.fn(),
    whoamiMock: vi.fn(),
  }),
)

vi.mock("@follow/store/user/getters", () => ({
  whoami: whoamiMock,
}))

vi.mock("@follow/tracker", () => ({
  tracker: {
    manager: {
      captureException: vi.fn(),
    },
  },
}))

vi.mock("~/lib/api-client", () => ({
  followClient: {
    api: {
      settings: {
        get: settingsGetMock,
        update: settingsUpdateMock,
      },
    },
  },
}))

vi.mock("~/queries/settings", () => ({
  settings: {
    get: () => ({
      key: ["settings"],
      fn: settingsPrefetchMock,
    }),
  },
}))

const createRule = () => ({
  id: "rule-1",
  enabled: true,
  pattern: "alpha",
  patternType: "keyword" as const,
  caseSensitive: false,
  color: "#FDE68A",
})

describe("desktop spotlight setting sync", () => {
  beforeEach(() => {
    const eventTarget = new EventTarget()
    Object.defineProperties(window, {
      addEventListener: {
        configurable: true,
        value: eventTarget.addEventListener.bind(eventTarget),
      },
      removeEventListener: {
        configurable: true,
        value: eventTarget.removeEventListener.bind(eventTarget),
      },
      dispatchEvent: {
        configurable: true,
        value: eventTarget.dispatchEvent.bind(eventTarget),
      },
    })

    whoamiMock.mockReturnValue({ id: "user-1" })
    settingsUpdateMock.mockResolvedValue({ code: 0 })
    settingsPrefetchMock.mockResolvedValue({
      code: 0,
      settings: {},
      updated: {},
    })
    settingsGetMock.mockResolvedValue({
      code: 0,
      settings: {},
      updated: {},
    })

    initializeDefaultUISettings()
    initializeDefaultGeneralSettings()
    initializeDefaultSpotlightSettings()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    settingSyncQueue.teardown()
    settingSyncQueue.queue = []
    localStorage.clear()
    initializeDefaultUISettings()
    initializeDefaultGeneralSettings()
    initializeDefaultSpotlightSettings()
  })

  test("applyRemoteSettings hydrates general settings from provided payload", () => {
    setGeneralSetting("language", "ja")

    settingSyncQueue.applyRemoteSettings({
      code: 0,
      settings: {
        general: {
          language: "en",
        },
      },
      updated: {
        general: "2030-04-14T12:00:00.000Z",
      },
    })

    expect(getGeneralSettings()).toMatchObject({
      language: "en",
      updated: Date.parse("2030-04-14T12:00:00.000Z"),
    })
    expect(settingsPrefetchMock).not.toHaveBeenCalled()
  })

  test("syncLocal hydrates spotlight rules from remote appearance settings", async () => {
    const rule = createRule()
    settingsPrefetchMock.mockResolvedValue({
      code: 0,
      settings: {
        appearance: {
          spotlights: [rule],
          spotlightsUpdated: 1710000000100,
        },
      },
      updated: {
        appearance: "2026-04-14T12:00:00.000Z",
      },
    })

    await settingSyncQueue.syncLocal()

    expect(getSpotlightSettings()).toMatchObject({
      updated: 1710000000100,
      spotlights: [rule],
    })
  })

  test("changing spotlight settings syncs them through the appearance tab", async () => {
    vi.useFakeTimers()

    const rule = createRule()
    settingsPrefetchMock.mockResolvedValue({
      code: 0,
      settings: {
        appearance: {
          uiFontFamily: "system-ui",
          spotlights: [],
        },
      },
      updated: {
        appearance: "2026-04-14T12:00:00.000Z",
      },
    })

    await settingSyncQueue.init()

    setSpotlightSetting("spotlights", [rule])

    await vi.advanceTimersByTimeAsync(1000)
    await Promise.resolve()

    expect(settingsUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tab: "appearance",
        spotlights: [rule],
      }),
    )
  })

  test("replaceRemoteIfEmpty does not overwrite existing remote settings", async () => {
    settingsGetMock.mockResolvedValue({
      code: 0,
      settings: {
        general: {
          language: "ja",
        },
      },
      updated: {
        general: "2026-04-14T12:00:00.000Z",
      },
    })

    await settingSyncQueue.replaceRemoteIfEmpty()

    expect(settingsUpdateMock).not.toHaveBeenCalled()
  })
})
