import { createContext, use } from "react"

import type { NavigationScrollTargets } from "./navigation-scroll-targets"

export const NavigationScrollTargetsContext = createContext<NavigationScrollTargets | null>(null)

export const useNavigationScrollTargets = () => {
  return use(NavigationScrollTargetsContext)
}
