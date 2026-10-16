import { IN_ELECTRON } from "@follow/shared/constants"
import { createBrowserRouter, createHashRouter } from "react-router"

import { ErrorElement } from "./components/common/ErrorElement"
import { NotFound } from "./components/common/NotFound"
// @ts-ignore
import { routes as tree } from "./generated-routes"

const isDebugProxyRuntime =
  !!globalThis["__DEBUG_PROXY__"] || globalThis.location?.pathname?.startsWith("/__debug_proxy")

// The settings routes only list the existing tabs, so a mistyped or outdated settings URL
// would fall through to the 404 page; it opens the settings modal on its first tab instead
const unknownSettingsTabRoute = {
  path: "settings/*",
  lazy: () => import("./pages/settings/layout"),
}

const routerCreator = IN_ELECTRON || isDebugProxyRuntime ? createHashRouter : createBrowserRouter

export const router = routerCreator([
  {
    path: "/",
    lazy: () => import("./App"),
    children: [...tree, unknownSettingsTabRoute],
    errorElement: <ErrorElement />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
])
