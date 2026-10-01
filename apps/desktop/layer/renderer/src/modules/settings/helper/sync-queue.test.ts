import { getSyncModelHandler } from "@follow/store/sync/model-registry"
import type { SyncAction } from "@follow/store/sync/types"
import { FollowAPIError } from "@follow-app/client-sdk"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { getAISettings, initializeDefaultAISettings, setAISetting } from "~/atoms/settings/ai"
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
import { queryClient } from "~/lib/query-client"

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
    initializeDefaultAISettings()
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
    initializeDefaultAISettings()
    initializeDefaultSpotlightSettings()
  })

  const settingAction = (tab: string, data: unknown): SyncAction => ({
    id: 1,
    model: "setting",
    modelId: tab,
    action: "U",
    data,
    createdAt: "2030-04-14T12:00:00.000Z",
  })

  test("the sync engine loads settings in full once and then applies logged tabs without a request", async () => {
    const handler = getSyncModelHandler("setting")!
    setGeneralSetting("language", "ja")
    queryClient.setQueryData(["settings"], { code: 0, settings: {}, updated: {} })

    await handler.apply(
      settingAction("general", {
        payload: { language: "en" },
        updatedAt: "2030-04-14T12:00:00.000Z",
      }),
    )

    expect(getGeneralSettings()).toMatchObject({
      language: "en",
      updated: Date.parse("2030-04-14T12:00:00.000Z"),
    })
    expect(settingsPrefetchMock).not.toHaveBeenCalled()
    // The cached `/settings` answer follows, for the settings dialog.
    expect(queryClient.getQueryData(["settings"])).toMatchObject({
      settings: { general: { language: "en" } },
      updated: { general: "2030-04-14T12:00:00.000Z" },
    })

    settingsPrefetchMock.mockResolvedValue({
      code: 0,
      settings: { general: { language: "fr" } },
      updated: { general: "2031-01-01T00:00:00.000Z" },
    })
    await handler.bootstrap?.()
    expect(settingsPrefetchMock).toHaveBeenCalledTimes(1)
    expect(getGeneralSettings()).toMatchObject({ language: "fr" })

    queryClient.removeQueries({ queryKey: ["settings"] })
  })

  test("a logged tab does not override a local change that is still waiting to be sent", async () => {
    const handler = getSyncModelHandler("setting")!
    setGeneralSetting("language", "ja")
    settingSyncQueue.queue.push({ tab: "general", payload: { language: "ja" }, date: Date.now() })

    await handler.apply(
      settingAction("general", {
        payload: { language: "en" },
        updatedAt: "2030-04-14T12:00:00.000Z",
      }),
    )

    expect(getGeneralSettings()).toMatchObject({ language: "ja" })
  })

  test("a settings load that failed is reported to the sync engine instead of counting as done", async () => {
    const handler = getSyncModelHandler("setting")!
    // A status the query client does not retry, so the test does not wait for back-off.
    settingsPrefetchMock.mockRejectedValue(new FollowAPIError("unprocessable", 422))

    await expect(handler.bootstrap?.()).rejects.toThrow("unprocessable")
    // The launch path keeps swallowing the error, as before.
    await expect(settingSyncQueue.syncLocal()).resolves.toBeUndefined()
    queryClient.removeQueries({ queryKey: ["settings"] })
  })

  test("a tab logged without its payload is read through the settings endpoint", async () => {
    const handler = getSyncModelHandler("setting")!
    settingsPrefetchMock.mockResolvedValue({
      code: 0,
      settings: { general: { language: "de" } },
      updated: { general: "2030-05-01T00:00:00.000Z" },
    })

    await handler.apply(settingAction("ai", { updatedAt: "2030-05-01T00:00:00.000Z" }))

    expect(settingsPrefetchMock).toHaveBeenCalledTimes(1)
    expect(getGeneralSettings()).toMatchObject({ language: "de" })
    queryClient.removeQueries({ queryKey: ["settings"] })
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

  test("the action language and the AI personalize prompt are sent to the server", async () => {
    vi.useFakeTimers()

    await settingSyncQueue.init()

    setGeneralSetting("actionLanguage", "fr-FR")
    setAISetting("personalizePrompt", "Call me Captain.")
    // Local-only AI settings stay on the device.
    setAISetting("showSplineButton", false)

    await vi.advanceTimersByTimeAsync(1000)
    await Promise.resolve()

    expect(settingsUpdateMock).toHaveBeenCalledTimes(2)
    expect(settingsUpdateMock).toHaveBeenCalledWith({ tab: "general", actionLanguage: "fr-FR" })
    expect(settingsUpdateMock).toHaveBeenCalledWith({
      tab: "ai",
      personalizePrompt: "Call me Captain.",
    })
  })

  test("a newer remote action language and personalize prompt replace the local ones", () => {
    setGeneralSetting("actionLanguage", "ja")
    setAISetting("personalizePrompt", "Keep answers short.")

    settingSyncQueue.applyRemoteSettings({
      code: 0,
      settings: {
        general: { actionLanguage: "fr-FR" },
        ai: { personalizePrompt: "Call me Captain." },
      },
      updated: {
        general: "2030-04-14T12:00:00.000Z",
        ai: "2030-04-14T12:00:00.000Z",
      },
    })

    expect(getGeneralSettings().actionLanguage).toBe("fr-FR")
    expect(getAISettings().personalizePrompt).toBe("Call me Captain.")
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
