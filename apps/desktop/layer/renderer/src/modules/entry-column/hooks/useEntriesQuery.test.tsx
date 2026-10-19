import { FeedViewType } from "@follow/constants"
import { queryClientContext } from "@follow/store/context"
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

  test("loads the end page of a short list asked for while it was refreshed", async () => {
    let resolveRefresh: ((value: EntriesResponse) => void) | undefined
    let firstPageRequests = 0
    const fetchEntriesSpy = vi
      .spyOn(entrySyncServices, "fetchEntries")
      .mockImplementation(async (props) => {
        if (props.pageParam) {
          return { data: [] } as unknown as EntriesResponse
        }

        firstPageRequests++
        if (firstPageRequests === 1) {
          return createEntriesResponse("entry-1", "2026-05-14T00:00:00.000Z")
        }
        return new Promise<EntriesResponse>((resolve) => {
          resolveRefresh = resolve
        })
      })
    const nextPageRequests = () =>
      fetchEntriesSpy.mock.calls.filter(([props]) => props.pageParam).length

    let entriesQuery: ReturnType<typeof useEntriesQuery> | undefined
    const EntriesQueryConsumer = () => {
      entriesQuery = useEntriesQuery({
        feedId: "feed-1",
        view: FeedViewType.Articles,
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
    queryClientContext.provide(queryClient)

    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient!}>
          <EntriesQueryConsumer />
        </QueryClientProvider>,
      )
    })
    await vi.waitFor(() => {
      expect(entriesQuery?.isSuccess).toBe(true)
    })

    // A short list ends with an empty page
    await act(async () => {
      await entriesQuery?.fetchNextPage()
    })
    await vi.waitFor(() => {
      expect(entriesQuery?.hasNextPage).toBe(false)
    })
    expect(nextPageRequests()).toBe(1)

    // A refresh starts over from the first page, which has a next page again
    let refresh: Promise<unknown> | undefined
    await act(async () => {
      refresh = entriesQuery?.refetch()
    })
    await vi.waitFor(() => {
      expect(entriesQuery?.isFetching).toBe(true)
    })
    expect(entriesQuery?.hasNextPage).toBe(true)

    // Asked for meanwhile, the next page would join the refresh and load nothing. It is asked
    // for again once the refresh is done, so the list reaches its end.
    let nextPage: Promise<unknown> | undefined
    await act(async () => {
      nextPage = entriesQuery?.fetchNextPage()
    })
    expect(nextPageRequests()).toBe(1)
    await act(async () => {
      resolveRefresh?.(createEntriesResponse("entry-1", "2026-05-14T00:00:00.000Z"))
      await Promise.all([refresh, nextPage])
    })
    await vi.waitFor(() => {
      expect(entriesQuery?.hasNextPage).toBe(false)
    })
    expect(nextPageRequests()).toBe(2)
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

  test("uses newest-first cache and request order for all-content timelines", async () => {
    const fetchEntriesSpy = vi
      .spyOn(entrySyncServices, "fetchEntries")
      .mockResolvedValue(createEntriesResponse("entry-1", "2026-05-14T00:00:00.000Z"))

    let entriesQuery: ReturnType<typeof useEntriesQuery> | undefined
    const EntriesQueryConsumer = ({ sortOrder }: { sortOrder: "asc" | "desc" }) => {
      entriesQuery = useEntriesQuery({
        feedId: "feed-1",
        sortOrder,
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
          <EntriesQueryConsumer sortOrder="asc" />
        </QueryClientProvider>,
      )
    })

    await vi.waitFor(() => {
      expect(entriesQuery?.isSuccess).toBe(true)
    })
    expect(entriesQuery?.queryKey.at(-1)).toBe("desc")
    expect(fetchEntriesSpy.mock.calls[0]?.[0].sortOrder).toBe("desc")

    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient!}>
          <EntriesQueryConsumer sortOrder="desc" />
        </QueryClientProvider>,
      )
    })

    expect(fetchEntriesSpy).toHaveBeenCalledTimes(1)
    expect(entriesQuery?.queryKey.at(-1)).toBe("desc")
  })

  test("isolates unread timeline pages by effective sort order", async () => {
    const fetchEntriesSpy = vi
      .spyOn(entrySyncServices, "fetchEntries")
      .mockResolvedValue(createEntriesResponse("entry-1", "2026-05-14T00:00:00.000Z"))

    let entriesQuery: ReturnType<typeof useEntriesQuery> | undefined
    const EntriesQueryConsumer = ({ sortOrder }: { sortOrder: "asc" | "desc" }) => {
      entriesQuery = useEntriesQuery({
        feedId: "feed-1",
        unreadOnly: true,
        sortOrder,
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
          <EntriesQueryConsumer sortOrder="desc" />
        </QueryClientProvider>,
      )
    })

    await vi.waitFor(() => {
      expect(entriesQuery?.isSuccess).toBe(true)
    })
    expect(entriesQuery?.queryKey.at(-1)).toBe("desc")

    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient!}>
          <EntriesQueryConsumer sortOrder="asc" />
        </QueryClientProvider>,
      )
    })

    await vi.waitFor(() => {
      expect(fetchEntriesSpy).toHaveBeenCalledTimes(2)
      expect(entriesQuery?.queryKey.at(-1)).toBe("asc")
    })
  })
})
