import { FeedViewType } from "@follow/constants"
import { Provider } from "jotai"
import * as React from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest"

import { initializeDefaultSpotlightSettings, setSpotlightSetting } from "~/atoms/settings/spotlight"
import { jotaiStore } from "~/lib/jotai"

import { EntryContentHTMLRenderer } from "./html"
import { EntryContentMarkdownRenderer } from "./markdown"

const { htmlMock, markdownMock, useEntryMock, getFeedByIdMock } = vi.hoisted(() => ({
  htmlMock: vi.fn(() => null),
  markdownMock: vi.fn(() => null),
  useEntryMock: vi.fn(),
  getFeedByIdMock: vi.fn(),
}))

vi.mock("@follow/store/entry/hooks", () => ({
  useEntry: useEntryMock,
}))

vi.mock("@follow/store/feed/getter", () => ({
  getFeedById: getFeedByIdMock,
}))

vi.mock("~/components/ui/markdown/HTML", () => ({
  HTML: htmlMock,
}))

vi.mock("~/components/ui/markdown/Markdown", () => ({
  Markdown: markdownMock,
}))

const rule = {
  id: "rule-1",
  enabled: true,
  pattern: "alpha",
  patternType: "keyword" as const,
  caseSensitive: false,
  color: "#FDE68A",
}

const renderComponent = async (element: React.ReactNode) => {
  const container = document.createElement("div")
  document.body.append(container)

  const root = createRoot(container)

  await act(async () => {
    root.render(<Provider store={jotaiStore}>{element}</Provider>)
  })

  return { container, root }
}

describe("entry content spotlight plumbing", () => {
  let root: Root | null = null
  let container: HTMLElement | null = null

  beforeAll(() => {
    ;(globalThis as typeof globalThis & { React: typeof React }).React = React
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
  })

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

    useEntryMock.mockReturnValue({
      images: {},
      url: "https://example.com/post",
    })
    getFeedByIdMock.mockReturnValue(null)
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

    initializeDefaultSpotlightSettings()
    vi.clearAllMocks()
  })

  test("EntryContentHTMLRenderer passes spotlight rules to HTML", async () => {
    initializeDefaultSpotlightSettings()
    setSpotlightSetting("spotlights", [rule])
    ;({ container, root } = await renderComponent(
      <EntryContentHTMLRenderer
        view={FeedViewType.Articles}
        feedId="feed-1"
        entryId="entry-1"
        as="article"
      >
        {"<p>alpha beta</p>"}
      </EntryContentHTMLRenderer>,
    ))

    expect(htmlMock).toHaveBeenCalledWith(
      expect.objectContaining({
        spotlightRules: [rule],
      }),
      undefined,
    )
  })

  test("EntryContentMarkdownRenderer passes spotlight rules to Markdown", async () => {
    initializeDefaultSpotlightSettings()
    setSpotlightSetting("spotlights", [rule])
    ;({ container, root } = await renderComponent(
      <EntryContentMarkdownRenderer view={FeedViewType.Articles} feedId="feed-1" entryId="entry-1">
        {"alpha beta"}
      </EntryContentMarkdownRenderer>,
    ))

    expect(markdownMock).toHaveBeenCalledWith(
      expect.objectContaining({
        spotlightRules: [rule],
      }),
      undefined,
    )
  })
})
