import { Provider } from "jotai"
import * as React from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest"

import { jotaiStore } from "~/lib/jotai"

import { FeedsSelectionList } from "./feeds-selection-list"
import { feedSelectionsAtom } from "./store"

const { messages } = vi.hoisted(() => ({
  messages: [
    {
      id: "assistant-1",
      role: "assistant",
      parts: [
        {
          type: "tool-onboardingGetTrendingFeeds",
          output: [
            { id: "feed-1", title: "First Feed", url: "https://one.example/feed" },
            { id: "feed-2", title: "Second Feed", url: "https://two.example/feed" },
          ],
        },
      ],
    },
  ],
}))

vi.mock("../ai-chat/store/hooks", () => ({ useMessages: () => messages }))
vi.mock("../ai-chat/components/3d-models/AISplineLoader", () => ({ AISplineLoader: () => null }))
vi.mock("../discover/DiscoverFeedCard", () => ({ SearchResultContent: () => null }))
vi.mock("../feed/feed-icon", () => ({ FeedIcon: () => null }))
vi.mock("~/hooks/common", () => ({
  useI18n: () => {
    const t = (key: string) => key
    return Object.assign(t, { app: t })
  },
}))

describe("FeedsSelectionList", () => {
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
    jotaiStore.set(feedSelectionsAtom, [])
  })

  test("shows the feeds the AI recommended as soon as they arrive", async () => {
    host = document.createElement("div")
    document.body.append(host)
    root = createRoot(host)

    await act(async () => {
      root!.render(
        <Provider store={jotaiStore}>
          <FeedsSelectionList />
        </Provider>,
      )
    })

    expect(host.querySelectorAll("[data-feed-id]")).toHaveLength(2)
    expect(host.textContent).not.toContain("new_user_guide.selection.empty_title")
  })
})
