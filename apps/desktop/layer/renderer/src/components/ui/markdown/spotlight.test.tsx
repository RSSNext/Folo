import type { SpotlightRule } from "@follow/shared/spotlight"
import { Provider } from "jotai"
import * as React from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest"

import { jotaiStore } from "~/lib/jotai"

import { HTML } from "./HTML"
import { Markdown } from "./Markdown"

const { getWrappedElementSizeMock } = vi.hoisted(() => ({
  getWrappedElementSizeMock: () => ({ h: 0, w: 0 }),
}))

vi.mock("~/providers/wrapped-element-provider", () => ({
  useWrappedElementSize: getWrappedElementSizeMock,
}))

const rule: SpotlightRule = {
  id: "rule-1",
  enabled: true,
  pattern: "alpha",
  patternType: "keyword",
  caseSensitive: false,
  color: "#FDE68A",
}

const renderMarkdownComponent = async (element: React.ReactNode) => {
  const container = document.createElement("div")
  document.body.append(container)

  const root = createRoot(container)

  await act(async () => {
    root.render(<Provider store={jotaiStore}>{element}</Provider>)
  })

  return { container, root }
}

describe("markdown spotlight rendering", () => {
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

  test("HTML applies spotlight rules to rendered content", async () => {
    ;({ container, root } = await renderMarkdownComponent(
      <HTML as="div" spotlightRules={[rule]}>
        {"<p>alpha beta</p>"}
      </HTML>,
    ))

    expect(container?.querySelector('[data-spotlight-rule-id="rule-1"]')?.textContent).toBe("alpha")
  })

  test("Markdown applies spotlight rules to rendered content", async () => {
    ;({ container, root } = await renderMarkdownComponent(
      <Markdown spotlightRules={[rule]}>{"alpha beta"}</Markdown>,
    ))

    expect(container?.querySelector('[data-spotlight-rule-id="rule-1"]')?.textContent).toBe("alpha")
  })
})
