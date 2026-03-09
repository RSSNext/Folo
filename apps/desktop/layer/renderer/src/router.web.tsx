import { IN_ELECTRON } from "@follow/shared/constants"
import { createBrowserRouter, createHashRouter } from "react-router"

import { ErrorElement } from "./components/common/ErrorElement"
import { NotFound } from "./components/common/NotFound"
// @ts-ignore
import { routes as tree } from "./generated-routes"

const isDebugProxyRuntime =
  !!globalThis["__DEBUG_PROXY__"] || globalThis.location?.pathname?.startsWith("/__debug_proxy")

const routerCreator = IN_ELECTRON || isDebugProxyRuntime ? createHashRouter : createBrowserRouter

export const router = routerCreator([
  {
    path: "/",
    lazy: () => import("./App"),
    children: tree,
    errorElement: <ErrorElement />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
])
