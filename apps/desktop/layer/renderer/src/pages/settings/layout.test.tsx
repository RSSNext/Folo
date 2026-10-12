import * as React from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { createMemoryRouter, RouterProvider } from "react-router"
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest"

import { Component as SettingsLayout } from "./layout"

const { showSettingsMock } = vi.hoisted(() => ({ showSettingsMock: vi.fn() }))

vi.mock("~/modules/settings/modal/use-setting-modal-hack", () => ({
  showSettings: showSettingsMock,
}))

describe("settings route", () => {
  let root: Root | null = null
  let host: HTMLElement | null = null

  beforeAll(() => {
    ;(globalThis as typeof globalThis & { React: typeof React }).React = React
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
  })

  afterEach(async () => {
    await act(async () => {
      root?.unmount()
    })
    host?.remove()
    root = null
    host = null
    showSettingsMock.mockClear()
  })

  const renderAt = async (path: string) => {
    const router = createMemoryRouter(
      [
        { path: "/", element: <output>main</output> },
        { path: "/settings/*", element: <SettingsLayout /> },
      ],
      { initialEntries: [path] },
    )
    host = document.createElement("div")
    document.body.append(host)
    root = createRoot(host)
    await act(async () => {
      root!.render(<RouterProvider router={router} />)
    })
    return router
  }

  test("opens the settings tab from the URL over the main view", async () => {
    const router = await renderAt("/settings/plan")

    expect(router.state.location.pathname).toBe("/")
    expect(showSettingsMock).toHaveBeenCalledWith("plan")
  })

  test("opens the default tab for the bare settings URL", async () => {
    const router = await renderAt("/settings")

    expect(router.state.location.pathname).toBe("/")
    expect(showSettingsMock).toHaveBeenCalledWith(undefined)
  })
})
