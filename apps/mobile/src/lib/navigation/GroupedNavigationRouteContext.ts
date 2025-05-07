import { createContext } from "react"

import type { Route } from "./ChainNavigationContext"

export const GroupedNavigationRouteContext = createContext<Route[][]>(null!)
