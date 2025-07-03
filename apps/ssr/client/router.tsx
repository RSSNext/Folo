import { wrapCreateBrowserRouterV7 } from "@sentry/react"
import { createBrowserRouter, createHashRouter } from "react-router"

import { NotFound } from "./components/common/404"
// @ts-ignore
import tree from "./generated-routes"

declare global {
  interface Window {
    SENTRY_RELEASE: string
    __DEBUG_PROXY__: boolean
  }
}
let routerCreator = window["__DEBUG_PROXY__"] ? createHashRouter : createBrowserRouter
if (window.SENTRY_RELEASE) {
  routerCreator = wrapCreateBrowserRouterV7(routerCreator)
}

export const router = routerCreator([
  {
    path: "/",
    lazy: () => import("./App"),
    children: tree,
    // errorElement: <ErrorElement />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
])
