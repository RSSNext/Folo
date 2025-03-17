import type { PrimitiveAtom } from "jotai"
import { createContext } from "react"

import type { TabScreenProps } from "./TabScreen"

export interface BottomTabContextType {
  currentIndexAtom: PrimitiveAtom<number>

  loadedableIndexAtom: PrimitiveAtom<Set<number>>

  tabScreensAtom: PrimitiveAtom<TabScreenProps[]>
}
export const BottomTabContext = createContext<BottomTabContextType>(null!)
