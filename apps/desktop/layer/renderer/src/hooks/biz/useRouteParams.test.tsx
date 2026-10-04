import { setRoute } from "@follow/components/atoms/route.js"
import { StableRouterProvider } from "@follow/components/providers/stable-router-provider.js"
import { FeedViewType } from "@follow/constants"
import { Provider } from "jotai"
import * as React from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { createMemoryRouter, Outlet, RouterProvider } from "react-router"
import { afterEach, beforeAll, describe, expect, test } from "vitest"

import { jotaiStore } from "~/lib/jotai"

import { useRouteParams, useRouteParamsSelector } from "./useRouteParams"

const RouteParamsProbe = () => {
  const { feedId, entryId, view } = useRouteParams()
  const selected = useRouteParamsSelector((params) => ({
    feedId: params.feedId,
    view: params.view,
  }))

  return (
    <>
      <output data-probe="params">{JSON.stringify({ feedId, entryId, view })}</output>
      <output data-probe="selector">{JSON.stringify(selected)}</output>
    </>
  )
}

const AppRoot = () => (
  <Provider store={jotaiStore}>
    <StableRouterProvider />
    <Outlet />
  </Provider>
)

const createRouter = (initialPath: string) =>
  createMemoryRouter(
    [
      {
        path: "/",
        Component: AppRoot,
        children: [
          { path: "discover", Component: () => <p>discover</p> },
          { path: "timeline/:timelineId/:feedId/:entryId", Component: RouteParamsProbe },
        ],
      },
    ],
    { initialEntries: [initialPath] },
  )

const readProbe = (container: HTMLElement, probe: "params" | "selector"): unknown =>
  JSON.parse(container.querySelector(`[data-probe="${probe}"]`)?.textContent ?? "null")

describe("useRouteParams", () => {
  let root: Root | null = null
  let host: HTMLElement | null = null

  const render = async (router: ReturnType<typeof createRouter>) => {
    const element = document.createElement("div")
    document.body.append(element)
    host = element
    root = createRoot(element)
    await act(async () => {
      root?.render(<RouterProvider router={router} />)
    })
    return element
  }

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
    setRoute({
      params: {},
      searchParams: new URLSearchParams(),
      location: { pathname: "", search: "", hash: "", state: null, key: "" },
    })
  })

  // StableRouterProvider writes the route atom in a layout effect, after the components of the
  // same commit have rendered. They must still end up with the route of that commit.
  test("reads the params of a deep URL on the first load", async () => {
    const container = await render(createRouter("/timeline/pictures/feed-1/pending"))

    expect(readProbe(container, "params")).toEqual({
      feedId: "feed-1",
      entryId: "pending",
      view: FeedViewType.Pictures,
    })
    expect(readProbe(container, "selector")).toEqual({
      feedId: "feed-1",
      view: FeedViewType.Pictures,
    })
  })

  test("reads the params after navigating into the timeline from another layout", async () => {
    const router = createRouter("/discover")
    const container = await render(router)
    expect(container.querySelector('[data-probe="params"]')).toBeNull()

    await act(async () => {
      await router.navigate("/timeline/videos/feed-2/pending")
    })

    expect(readProbe(container, "params")).toEqual({
      feedId: "feed-2",
      entryId: "pending",
      view: FeedViewType.Videos,
    })
    expect(readProbe(container, "selector")).toEqual({
      feedId: "feed-2",
      view: FeedViewType.Videos,
    })
  })
})
