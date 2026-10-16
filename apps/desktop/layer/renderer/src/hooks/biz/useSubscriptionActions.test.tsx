import type { SubscriptionModel } from "@follow/store/subscription/types"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest"

import { useDeleteSubscription } from "./useSubscriptionActions"

const mocks = vi.hoisted(() => ({
  unsubscribe: vi.fn(),
  subscribe: vi.fn(),
  refresh: vi.fn(),
  toastWarning: vi.fn(),
  toastFetchError: vi.fn(),
}))

vi.mock("@follow/store/subscription/store", () => ({
  subscriptionSyncService: {
    unsubscribe: mocks.unsubscribe,
    subscribe: mocks.subscribe,
    refresh: mocks.refresh,
  },
}))

vi.mock("sonner", () => ({
  toast: {
    warning: mocks.toastWarning,
    success: vi.fn(),
    dismiss: vi.fn(),
  },
}))

vi.mock("~/lib/error-parser", () => ({
  toastFetchError: mocks.toastFetchError,
}))

vi.mock("./useNavigateEntry", () => ({
  navigateEntry: vi.fn(),
}))

vi.mock("./useRouteParams", () => ({
  getRouteParams: () => ({ feedId: undefined, view: 0 }),
}))

const subscription: SubscriptionModel = {
  feedId: "feed-1",
  listId: null,
  inboxId: null,
  userId: "user-1",
  view: 0,
  isPrivate: false,
  hideFromTimeline: null,
  title: "My SSPAI",
  category: "Tech",
  createdAt: "2026-10-01T00:00:00.000Z",
  type: "feed",
}

let deleteSubscription: ReturnType<typeof useDeleteSubscription> | null = null

const Probe = () => {
  deleteSubscription = useDeleteSubscription()
  return null
}

const undoFromToast = async () => {
  const options = mocks.toastWarning.mock.calls.at(-1)?.[1] as {
    action: { onClick: () => Promise<void> }
  }
  await options.action.onClick()
}

describe("useDeleteSubscription undo", () => {
  let root: Root | null = null
  let host: HTMLElement | null = null

  beforeAll(() => {
    ;(globalThis as typeof globalThis & { React: typeof React }).React = React
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
  })

  beforeEach(async () => {
    vi.clearAllMocks()
    mocks.refresh.mockResolvedValue(undefined)
    mocks.subscribe.mockResolvedValue(undefined)

    host = document.createElement("div")
    document.body.append(host)
    root = createRoot(host)
    const queryClient = new QueryClient()
    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <Probe />
        </QueryClientProvider>,
      )
    })
  })

  afterEach(async () => {
    await act(async () => {
      root?.unmount()
    })
    host?.remove()
    root = null
    host = null
    deleteSubscription = null
  })

  test("follows the feed again with the custom title it had", async () => {
    mocks.unsubscribe.mockResolvedValue([
      { type: "feed", id: "feed-1", url: "https://sspai.com/feed", title: "少数派" },
    ])

    await act(async () => {
      await deleteSubscription?.mutateAsync({ subscription })
    })
    await undoFromToast()

    expect(mocks.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://sspai.com/feed",
        feedId: "feed-1",
        title: "My SSPAI",
        category: "Tech",
      }),
    )
  })

  test("does not turn the feed's own title into a custom title", async () => {
    mocks.unsubscribe.mockResolvedValue([
      { type: "feed", id: "feed-1", url: "https://sspai.com/feed", title: "少数派" },
    ])

    await act(async () => {
      await deleteSubscription?.mutateAsync({ subscription: { ...subscription, title: null } })
    })
    await undoFromToast()

    expect(mocks.subscribe).toHaveBeenCalledWith(expect.objectContaining({ title: null }))
  })

  test("names the feed in the toast as the sidebar did", async () => {
    mocks.unsubscribe.mockResolvedValue([
      { type: "feed", id: "feed-1", url: "https://sspai.com/feed", title: "少数派" },
    ])

    await act(async () => {
      await deleteSubscription?.mutateAsync({ subscription })
    })

    const options = mocks.toastWarning.mock.calls.at(-1)?.[1] as {
      description: React.ReactElement<{ title: string }>
    }
    expect(options.description.props.title).toBe("My SSPAI")
  })

  test("follows a list again by its list id only", async () => {
    mocks.unsubscribe.mockResolvedValue([{ type: "list", id: "list-1", title: "Undo List" }])

    await act(async () => {
      await deleteSubscription?.mutateAsync({
        subscription: { ...subscription, feedId: null, listId: "list-1", type: "list" },
      })
    })
    await undoFromToast()

    const [form] = mocks.subscribe.mock.calls[0]!
    expect(form).toMatchObject({ listId: "list-1", url: undefined })
    expect(form.feedId).toBeUndefined()
  })

  test("reports an undo the server rejects", async () => {
    const error = new Error("Feed not found")
    mocks.unsubscribe.mockResolvedValue([
      { type: "feed", id: "feed-1", url: "https://sspai.com/feed", title: "少数派" },
    ])
    mocks.subscribe.mockRejectedValue(error)

    await act(async () => {
      await deleteSubscription?.mutateAsync({ subscription })
    })
    await undoFromToast()

    expect(mocks.toastFetchError).toHaveBeenCalledWith(error)
  })
})
