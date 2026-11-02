import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest"

import { FeedForm } from "./FeedForm"

const FEED = { id: "feed-1", type: "feed", url: "https://example.com/feed.xml", title: "Example" }

const mocks = vi.hoisted(() => {
  const subscriptions = new Map<string, { view: number; type: "feed" }>()
  const listeners = new Set<() => void>()
  return {
    subscriptions,
    listeners,
    setSubscription: (id: string, subscription: { view: number; type: "feed" }) => {
      subscriptions.set(id, subscription)
      for (const listener of listeners) listener()
    },
    subscribe: vi.fn(),
    edit: vi.fn(),
    toast: vi.fn(),
    onSuccess: vi.fn(),
    feedError: null as Error | null,
    isPaymentEnabled: false,
    presentSettings: vi.fn(),
  }
})

vi.mock("@follow/store/subscription/hooks", async () => {
  const { useSyncExternalStore } = await import("react")
  const subscribe = (listener: () => void) => {
    mocks.listeners.add(listener)
    return () => mocks.listeners.delete(listener)
  }
  return {
    useCategories: () => [],
    useSubscriptionByFeedId: (id: string) =>
      useSyncExternalStore(subscribe, () => mocks.subscriptions.get(id)),
  }
})
vi.mock("@follow/store/subscription/store", () => ({
  subscriptionSyncService: { subscribe: mocks.subscribe, edit: mocks.edit },
}))
vi.mock("@follow/store/feed/hooks", () => ({ useFeedByIdOrUrl: () => undefined }))
vi.mock("@follow/store/user/getters", () => ({ whoami: () => ({ id: "user-1" }) }))
vi.mock("@follow/store/user/hooks", () => ({
  useIsLoggedIn: () => true,
  useUserRole: () => "user",
}))
vi.mock("@follow/tracker", () => ({ tracker: { subscribeModalOpened: vi.fn() } }))
vi.mock("sonner", () => ({ toast: mocks.toast }))
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock("~/atoms/server-configs", () => ({ useIsPaymentEnabled: () => mocks.isPaymentEnabled }))
vi.mock("~/components/ui/auto-completion", () => ({ Autocomplete: () => null }))
vi.mock("~/components/ui/modal/stacked/hooks", () => ({
  useCurrentModal: () => ({ setClickOutSideToDismiss: () => {}, dismiss: () => {} }),
  useIsInModal: () => false,
  useModalUnsavedChanges: () => {},
}))
vi.mock("~/hooks/biz/useRouteParams", () => ({ getRouteParams: () => ({ view: 0 }) }))
vi.mock("~/hooks/common", () => ({
  useI18n: () => Object.assign((key: string) => key, { common: (key: string) => key }),
}))
vi.mock("~/hooks/common/useFormHasChanges", () => ({ useFormHasChanges: () => false }))
vi.mock("~/lib/error-parser", () => ({
  getFetchErrorMessage: (error: Error) => `translated ${error.message}`,
  isPaidRSSHubRouteError: (error: unknown) =>
    error instanceof Error && error.message === "paid route",
  toastFetchError: vi.fn(),
}))
vi.mock("~/modules/settings/modal/useSettingModal", () => ({
  useSettingModal: () => mocks.presentSettings,
}))
vi.mock("~/queries/feed", () => ({
  feed: { byId: () => ({ invalidate: () => {} }) },
  useFeedQuery: () =>
    mocks.feedError
      ? { data: undefined, isLoading: false, isError: true, error: mocks.feedError }
      : {
          data: { feed: FEED, entries: [], subscription: mocks.subscriptions.get(FEED.id) },
          isLoading: false,
          isError: false,
          error: null,
        },
}))
vi.mock("../shared/ViewSelectorRadioGroup", () => ({ ViewSelectorRadioGroup: () => null }))
vi.mock("./FeedSummary", () => ({ FeedSummary: () => null }))

const flush = async () => {
  for (let index = 0; index < 5; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

describe("FeedForm", () => {
  let root: Root | null = null
  let host: HTMLElement | null = null

  const render = async () => {
    host = document.createElement("div")
    document.body.append(host)
    root = createRoot(host)
    await act(async () => {
      root?.render(
        <QueryClientProvider client={new QueryClient()}>
          <FeedForm url={FEED.url} onSuccess={mocks.onSuccess} />
        </QueryClientProvider>,
      )
    })
  }

  const submit = async () => {
    await act(async () => {
      host
        ?.querySelector("form")
        ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
      await flush()
    })
  }

  const submitLabel = () => host?.querySelector('[data-testid="feed-form-submit"]')?.textContent

  beforeAll(() => {
    ;(globalThis as typeof globalThis & { React: typeof React }).React = React
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.subscriptions.clear()
    mocks.feedError = null
    mocks.isPaymentEnabled = false
  })

  afterEach(async () => {
    await act(async () => {
      root?.unmount()
    })
    host?.remove()
    root = null
    host = null
  })

  test("says a new feed was followed, though the store has the subscription before it settles", async () => {
    let settle: () => void = () => {}
    mocks.subscribe.mockImplementation(async () => {
      // As the subscription store does once the server answered
      mocks.setSubscription(FEED.id, { view: 0, type: "feed" })
      await new Promise<void>((resolve) => {
        settle = resolve
      })
    })
    await render()
    expect(submitLabel()).toBe("feed_form.follow")

    await submit()
    expect(mocks.subscribe).toHaveBeenCalledTimes(1)
    expect(mocks.edit).not.toHaveBeenCalled()
    expect(submitLabel()).toBe("feed_form.follow")

    await act(async () => {
      settle()
      await flush()
    })
    expect(mocks.toast).toHaveBeenCalledWith("feed_form.followed", { duration: 1000 })
    expect(mocks.onSuccess).toHaveBeenCalledTimes(1)
    // The form closes now, still reading as the follow it was
    expect(submitLabel()).toBe("feed_form.follow")
  })

  test("says a followed feed was updated", async () => {
    mocks.setSubscription(FEED.id, { view: 0, type: "feed" })
    mocks.edit.mockResolvedValue(undefined)
    await render()
    expect(submitLabel()).toBe("feed_form.update")

    await submit()

    expect(mocks.edit).toHaveBeenCalledTimes(1)
    expect(mocks.subscribe).not.toHaveBeenCalled()
    expect(mocks.toast).toHaveBeenCalledWith("feed_form.updated", { duration: 1000 })
  })

  test("asks to upgrade for a feed whose route is for paid plans", async () => {
    mocks.feedError = new Error("paid route")
    mocks.isPaymentEnabled = true
    await render()

    expect(host?.textContent).toContain("translated paid route")
    expect(host?.textContent).not.toContain("feed_form.error_fetching_feed")
    const upgrade = [...(host?.querySelectorAll("button") ?? [])].find((button) =>
      button.textContent?.includes("subscription.actions.upgrade"),
    )
    expect(upgrade).toBeDefined()
    act(() => upgrade?.click())
    expect(mocks.presentSettings).toHaveBeenCalledWith("plan")
  })

  test("says why a feed could not be loaded", async () => {
    mocks.feedError = new Error("Feed failed to parse")
    await render()

    expect(host?.textContent).toContain("feed_form.error_fetching_feed")
    expect(host?.textContent).toContain("translated Feed failed to parse")
  })
})
