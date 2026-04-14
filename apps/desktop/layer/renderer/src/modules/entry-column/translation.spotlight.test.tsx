import { Provider } from "jotai"
import * as React from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest"

import { jotaiStore } from "~/lib/jotai"

import { EntryTranslation } from "./translation"

vi.mock("~/atoms/settings/general", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/atoms/settings/general")>()

  return {
    ...actual,
    useGeneralSettingKey: vi.fn(() => "translation"),
  }
})

vi.mock("~/atoms/settings/spotlight", () => ({
  useSpotlightSettingKey: vi.fn(() => [
    {
      id: "rule-1",
      enabled: true,
      pattern: "alpha",
      patternType: "keyword",
      caseSensitive: false,
      color: "#FDE68A",
    },
  ]),
}))

const renderTranslation = async (element: React.ReactNode) => {
  const container = document.createElement("div")
  document.body.append(container)

  const root = createRoot(container)

  await act(async () => {
    root.render(<Provider store={jotaiStore}>{element}</Provider>)
  })

  return { container, root }
}

describe("EntryTranslation spotlight", () => {
  let root: Root | null = null
  let container: HTMLElement | null = null

  beforeAll(() => {
    ;(globalThis as typeof globalThis & { React: typeof React }).React = React
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
  })

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount()
      })
    }

    container?.remove()
    root = null
    container = null
  })

  test("highlights matching plain-text entry titles", async () => {
    ;({ container, root } = await renderTranslation(
      <EntryTranslation source="alpha beta" target={null} />,
    ))

    expect(container?.querySelector('[data-spotlight-rule-id="rule-1"]')?.textContent).toBe("alpha")
  })
})
