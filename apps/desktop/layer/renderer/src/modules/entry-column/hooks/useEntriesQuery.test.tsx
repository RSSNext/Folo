import { FeedViewType } from "@follow/constants"
import { useEntriesQuery } from "@follow/store/entry/hooks"
import { entrySyncServices } from "@follow/store/entry/store"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest"

type EntriesResponse = Awaited<ReturnType<typeof entrySyncServices.fetchEntries>>

const createEntriesResponse = (
  entryId: string,
  publishedAt: string,
  collectionCreatedAt?: string,
) =>
  ({
    data: [
      {
        entries: {
          id: entryId,
          publishedAt,
        },
        ...(collectionCreatedAt && {
          collections: {
            createdAt: collectionCreatedAt,
          },
        }),
      },
    ],
  }) as unknown as EntriesResponse

describe("useEntriesQuery", () => {
  let root: Root | null = null
  let container: HTMLElement | null = null
  let queryClient: QueryClient | null = null

  beforeAll(() => {
    ;(globalThis as typeof globalThis & { React: typeof React }).React = React
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
    ;(
      globalThis.window as typeof globalThis.window & {
        removeEventListener?: typeof globalThis.window.removeEventListener
      }
    ).removeEventListener ||= () => {}
  })

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount()
      })
    }

    queryClient?.clear()
    container?.remove()
    root = null
    container = null
    queryClient = null
    vi.restoreAllMocks()
  })

  test("coalesces repeated next-page requests while one is still in flight", async () => {
    const pendingPageResolvers: Array<(value: EntriesResponse) => void> = []
    const fetchEntriesSpy = vi
      .spyOn(entrySyncServices, "fetchEntries")
      .mockImplementation(async (props) => {
        if (props.pageParam) {
          return new Promise<EntriesResponse>((resolve) => {
            pendingPageResolvers.push(resolve)
          })
        }

        return createEntriesResponse("entry-1", "2026-05-14T00:00:00.000Z")
      })

    let entriesQuery: ReturnType<typeof useEntriesQuery> | undefined
    const EntriesQueryConsumer = () => {
      entriesQuery = useEntriesQuery({
        feedId: "collections",
        view: FeedViewType.Articles,
        limit: 1,
      })

      return null
    }

    container = document.createElement("div")
    document.body.append(container)
    root = createRoot(container)
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient!}>
          <EntriesQueryConsumer />
        </QueryClientProvider>,
      )
    })

    await act(async () => {
      await vi.waitFor(() => {
        expect(entriesQuery?.isSuccess).toBe(true)
      })
    })

    let firstFetch: Promise<unknown> | undefined
    let secondFetch: Promise<unknown> | undefined
    await act(async () => {
      firstFetch = entriesQuery?.fetchNextPage()
      secondFetch = entriesQuery?.fetchNextPage()
      await Promise.resolve()
    })

    expect(fetchEntriesSpy).toHaveBeenCalledTimes(2)
    expect(pendingPageResolvers).toHaveLength(1)

    await act(async () => {
      pendingPageResolvers[0]?.(createEntriesResponse("entry-2", "2026-05-13T00:00:00.000Z"))
      await Promise.allSettled([firstFetch, secondFetch])
    })

    await act(async () => {
      await vi.waitFor(() => {
        expect(entriesQuery?.entriesIds).toEqual(["entry-1", "entry-2"])
      })
    })

    await act(async () => {
      firstFetch = entriesQuery?.fetchNextPage()
      secondFetch = entriesQuery?.fetchNextPage()
      await Promise.resolve()
    })

    expect(fetchEntriesSpy).toHaveBeenCalledTimes(3)
    expect(pendingPageResolvers).toHaveLength(2)

    await act(async () => {
      pendingPageResolvers[1]?.(createEntriesResponse("entry-3", "2026-05-12T00:00:00.000Z"))
      await Promise.allSettled([firstFetch, secondFetch])
    })
  })

  test("uses collection created time as next-page cursor for starred entries", async () => {
    const fetchEntriesSpy = vi
      .spyOn(entrySyncServices, "fetchEntries")
      .mockImplementation(async (props) => {
        if (props.pageParam) {
          return createEntriesResponse("entry-2", "2026-02-27T00:00:00.000Z")
        }

        return createEntriesResponse(
          "entry-1",
          "2026-02-28T00:00:00.000Z",
          "2026-03-02T00:00:00.000Z",
        )
      })

    let entriesQuery: ReturnType<typeof useEntriesQuery> | undefined
    const EntriesQueryConsumer = () => {
      entriesQuery = useEntriesQuery({
        feedId: "collections",
        view: FeedViewType.Articles,
        limit: 1,
      })

      return null
    }

    container = document.createElement("div")
    document.body.append(container)
    root = createRoot(container)
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient!}>
          <EntriesQueryConsumer />
        </QueryClientProvider>,
      )
    })

    await act(async () => {
      await vi.waitFor(() => {
        expect(entriesQuery?.isSuccess).toBe(true)
      })
    })

    await act(async () => {
      await entriesQuery?.fetchNextPage()
    })

    await vi.waitFor(() => {
      expect(fetchEntriesSpy).toHaveBeenCalledTimes(2)
    })
    expect(fetchEntriesSpy.mock.calls[1]?.[0].pageParam).toBe("2026-03-02T00:00:00.000Z")
  })
})
