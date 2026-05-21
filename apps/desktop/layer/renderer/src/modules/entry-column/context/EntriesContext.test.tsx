import * as React from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest"

import type { useEntriesByView as useEntriesByViewType } from "../hooks/useEntriesByView"
import { EntriesProvider, useEntriesActions } from "./EntriesContext"

const mocks = vi.hoisted(() => ({
  useEntriesByView: vi.fn(),
  routeParams: vi.fn(() => ({ view: 0 })),
}))

vi.mock("../hooks/useEntriesByView", () => ({
  useEntriesByView: mocks.useEntriesByView,
}))

vi.mock("~/hooks/biz/useRouteParams", () => ({
  useRouteParams: mocks.routeParams,
}))

const useEntriesByViewMock = mocks.useEntriesByView as unknown as {
  mockReturnValue: (value: ReturnType<typeof useEntriesByViewType>) => void
}

describe("EntriesProvider", () => {
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
    vi.restoreAllMocks()
  })

  test("runs the registered reset callback before refetching entries", async () => {
    const events: string[] = []
    const refetch = vi.fn(async () => {
      events.push("refetch")
    })

    useEntriesByViewMock.mockReturnValue({
      type: "remote",
      entriesIds: [],
      groupedCounts: undefined,
      hasNextPage: false,
      isFetchingNextPage: false,
      isFetching: false,
      isLoading: false,
      error: null,
      refetch,
      fetchNextPage: vi.fn(),
      hasNext: false,
      isRefetching: false,
      isReady: true,
    })

    let refetchEntries: (() => void | Promise<void>) | undefined
    const reset = vi.fn(() => {
      events.push("reset")
    })

    const Consumer = () => {
      const actions = useEntriesActions()

      React.useEffect(() => {
        actions.setOnReset(reset)
        refetchEntries = actions.refetch

        return () => {
          actions.setOnReset(null)
        }
      }, [actions])

      return null
    }

    container = document.createElement("div")
    document.body.append(container)
    root = createRoot(container)

    await act(async () => {
      root?.render(
        <EntriesProvider>
          <Consumer />
        </EntriesProvider>,
      )
    })

    await act(async () => {
      await refetchEntries?.()
    })

    expect(events).toEqual(["reset", "refetch"])
  })
})
