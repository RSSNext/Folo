import { describe, expect, it, vi } from "vitest"

import * as generalRouteModule from "~/pages/settings/(settings)/general"

import { getSettingPages } from "./settings-glob"
import type { SettingPageConfig } from "./utils"

vi.mock("@follow/shared/env.desktop", () => ({
  env: {
    VITE_API_URL: "https://api.example.com",
    VITE_WEB_URL: "https://app.example.com",
  },
}))

type SettingRouteModule = {
  handle?: SettingPageConfig
  loader?: unknown
}

describe("settings route metadata", () => {
  it("uses route handles while preserving the modal metadata mapping", () => {
    const pages = getSettingPages() as Record<string, { loader: SettingPageConfig }>
    const routeModule = generalRouteModule as SettingRouteModule

    expect(Object.keys(pages)).toHaveLength(14)
    expect(routeModule.loader).toBeUndefined()
    expect(routeModule.handle).toBeDefined()
    expect(pages.general?.loader).toBe(routeModule.handle)
  })
})
