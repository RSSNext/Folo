import type { InfiniteData } from "@tanstack/react-query"
import { InfiniteQueryObserver, QueryClient } from "@tanstack/react-query"
import { afterEach, describe, expect, test, vi } from "vitest"

import { fetchNextPageAfterRefetch } from "./next-page"

interface Page {
  data: Array<{ id: string }>
}

const queryKey = ["entries", "short-feed"]

/**
 * A short list: one page of entries and the empty page that ends it. The refetch of the first
 * page waits until the test lets it answer, or fails when asked to.
 */
const createShortList = () => {
  const requests: Array<string | undefined> = []
  let firstPageRequests = 0
  let releaseRefetch: (() => void) | undefined
  let failRefetch = false

  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const observer = new InfiniteQueryObserver<
    Page,
    Error,
    InfiniteData<Page, string | undefined>,
    string[],
    string | undefined
  >(client, {
    queryKey,
    initialPageParam: undefined,
    queryFn: async ({ pageParam }) => {
      requests.push(pageParam)
      if (pageParam) return { data: [] }

      firstPageRequests++
      if (firstPageRequests > 1) {
        await new Promise<void>((resolve) => {
          releaseRefetch = resolve
        })
        if (failRefetch) throw new Error("The server is unreachable")
      }
      return { data: [{ id: "entry-1" }] }
    },
    getNextPageParam: (lastPage) => lastPage.data.at(-1)?.id,
  })
  const unsubscribe = observer.subscribe(() => {})

  /** Starts a refresh: the list keeps its first page, so a next page is possible again */
  const refresh = () => {
    client.setQueryData<InfiniteData<Page, string | undefined>>(queryKey, (current) =>
      current
        ? { pages: current.pages.slice(0, 1), pageParams: current.pageParams.slice(0, 1) }
        : current,
    )
    return observer.refetch()
  }

  const load = async () => {
    await vi.waitFor(() => {
      expect(observer.getCurrentResult().isSuccess).toBe(true)
    })
    await observer.fetchNextPage()
    expect(observer.getCurrentResult().hasNextPage).toBe(false)
  }

  return {
    client,
    observer,
    requests,
    refresh,
    load,
    answerRefetch: (options: { fail?: boolean } = {}) => {
      failRefetch = options.fail === true
      releaseRefetch?.()
    },
    dispose: () => {
      unsubscribe()
      client.clear()
    },
  }
}

describe("fetchNextPageAfterRefetch", () => {
  let dispose: (() => void) | undefined
  afterEach(() => {
    dispose?.()
    dispose = undefined
  })

  test("TanStack drops a next page asked for while the first page is refetched", async () => {
    const list = createShortList()
    dispose = list.dispose
    await list.load()

    const refresh = list.refresh()
    const next = list.observer.fetchNextPage({ cancelRefetch: false })
    list.answerRefetch()
    await Promise.all([refresh, next])

    // The end page is not asked for again, so the list waits for it
    expect(list.requests).toEqual([undefined, "entry-1", undefined])
    expect(list.observer.getCurrentResult().hasNextPage).toBe(true)
  })

  test("asks for the next page again once the refetch is done", async () => {
    const list = createShortList()
    dispose = list.dispose
    await list.load()

    const refresh = list.refresh()
    const next = fetchNextPageAfterRefetch(list.client.getQueryState(queryKey), (options) =>
      list.observer.fetchNextPage(options),
    )
    list.answerRefetch()
    await Promise.all([refresh, next])

    expect(list.requests).toEqual([undefined, "entry-1", undefined, "entry-1"])
    expect(list.observer.getCurrentResult().hasNextPage).toBe(false)
  })

  test("doesn't ask again after a failed refetch", async () => {
    const list = createShortList()
    dispose = list.dispose
    await list.load()

    const refresh = list.refresh()
    const next = fetchNextPageAfterRefetch(list.client.getQueryState(queryKey), (options) =>
      list.observer.fetchNextPage(options),
    )
    list.answerRefetch({ fail: true })
    await Promise.all([refresh, next])

    expect(list.requests).toEqual([undefined, "entry-1", undefined])
  })

  test("asks once when no refetch is running", async () => {
    const list = createShortList()
    dispose = list.dispose
    await vi.waitFor(() => {
      expect(list.observer.getCurrentResult().isSuccess).toBe(true)
    })

    await fetchNextPageAfterRefetch(list.client.getQueryState(queryKey), (options) =>
      list.observer.fetchNextPage(options),
    )

    expect(list.requests).toEqual([undefined, "entry-1"])
  })
})
