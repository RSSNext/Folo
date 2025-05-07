import { createContext } from "react"

import type { Navigation } from "./Navigation"

export const NavigationInstanceContext = createContext<Navigation>(null!)
