import { IN_ELECTRON } from "@follow/shared/constants"
import { wrapCreateBrowserRouterV7 } from "@sentry/react"
import { createBrowserRouter, createHashRouter } from "react-router"

import { Component as App } from "./App"
import { ErrorElement } from "./components/common/ErrorElement"
import { NotFound } from "./components/common/NotFound"
// @ts-ignore
import { routes as tree } from "./generated-routes"

let routerCreator =
  IN_ELECTRON || globalThis["__DEBUG_PROXY__"] ? createHashRouter : createBrowserRouter
if (window.SENTRY_RELEASE) {
  routerCreator = wrapCreateBrowserRouterV7(routerCreator)
}

export const router = routerCreator([
  {
    path: "/",
    Component: App,
    children: tree,
    errorElement: <ErrorElement />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
])
