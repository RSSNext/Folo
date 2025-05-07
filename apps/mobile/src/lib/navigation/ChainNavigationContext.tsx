import type { PrimitiveAtom } from "jotai"
import { createContext } from "react"

import type {
  NavigationControllerView,
  NavigationControllerViewExtraProps,
  NavigationControllerViewType,
} from "./types"

export interface Route {
  id: string

  Component?: NavigationControllerView<any>
  element?: React.ReactElement

  type: NavigationControllerViewType
  props?: unknown
  screenOptions?: NavigationControllerViewExtraProps
}
export type ChainNavigationContextType = {
  routesAtom: PrimitiveAtom<Route[]>
}
export const ChainNavigationContext = createContext<ChainNavigationContextType>(null!)
